using System;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.LabWorks;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.LabWorks;

public abstract class LabWorkAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly ILabWorkAppService _labWorkAppService;
    private readonly IPatientAppService _patientAppService;

    protected LabWorkAppServiceTests()
    {
        _labWorkAppService = GetRequiredService<ILabWorkAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
    }

    private async Task<Guid> CreateTestPatientAsync()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "LabWork Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        return patient.Id;
    }

    [Fact]
    public async Task Should_Create_LabWork_With_Default_Sent_Status()
    {
        var patientId = await CreateTestPatientAsync();

        var result = await _labWorkAppService.CreateAsync(new CreateUpdateLabWorkDto
        {
            PatientId = patientId,
            LabName = "ABC Dental Lab",
            WorkType = "Crown",
            SentDate = DateTime.UtcNow,
            ToothNumberList = new() { 11, 12 },
            Cost = 500000
        });

        result.Status.ShouldBe(LabWorkStatus.Sent);
        result.ToothNumberList.ShouldBe(new() { 11, 12 });
        result.PatientFullName.ShouldBe("LabWork Test Patient");
    }

    [Fact]
    public async Task Should_Throw_For_Invalid_Tooth_Number()
    {
        var patientId = await CreateTestPatientAsync();

        await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _labWorkAppService.CreateAsync(new CreateUpdateLabWorkDto
            {
                PatientId = patientId,
                LabName = "ABC Dental Lab",
                WorkType = "Crown",
                SentDate = DateTime.UtcNow,
                ToothNumberList = new() { 99 }
            });
        });
    }

    [Fact]
    public async Task Should_Update_Status_And_Set_ReceivedDate_When_Received()
    {
        var patientId = await CreateTestPatientAsync();
        var labWork = await _labWorkAppService.CreateAsync(new CreateUpdateLabWorkDto
        {
            PatientId = patientId,
            LabName = "ABC Dental Lab",
            WorkType = "Crown",
            SentDate = DateTime.UtcNow
        });

        labWork.ReceivedDate.ShouldBeNull();

        var updated = await _labWorkAppService.UpdateStatusAsync(labWork.Id, new UpdateLabWorkStatusDto
        {
            Status = LabWorkStatus.Received
        });

        updated.Status.ShouldBe(LabWorkStatus.Received);
        updated.ReceivedDate.ShouldNotBeNull();
    }

    [Fact]
    public async Task Should_Get_Board_Excluding_Cancelled()
    {
        var patientId = await CreateTestPatientAsync();
        var active = await _labWorkAppService.CreateAsync(new CreateUpdateLabWorkDto
        {
            PatientId = patientId,
            LabName = "Lab A",
            WorkType = "Crown",
            SentDate = DateTime.UtcNow
        });
        var cancelled = await _labWorkAppService.CreateAsync(new CreateUpdateLabWorkDto
        {
            PatientId = patientId,
            LabName = "Lab B",
            WorkType = "Bridge",
            SentDate = DateTime.UtcNow,
            Status = LabWorkStatus.Cancelled
        });

        var board = await _labWorkAppService.GetBoardAsync();

        board.ShouldContain(x => x.Id == active.Id);
        board.ShouldNotContain(x => x.Id == cancelled.Id);
    }

    [Fact]
    public async Task Should_Delete_LabWork()
    {
        var patientId = await CreateTestPatientAsync();
        var labWork = await _labWorkAppService.CreateAsync(new CreateUpdateLabWorkDto
        {
            PatientId = patientId,
            LabName = "Lab A",
            WorkType = "Crown",
            SentDate = DateTime.UtcNow
        });

        await _labWorkAppService.DeleteAsync(labWork.Id);

        await Should.ThrowAsync<Exception>(async () => await _labWorkAppService.GetAsync(labWork.Id));
    }
}
