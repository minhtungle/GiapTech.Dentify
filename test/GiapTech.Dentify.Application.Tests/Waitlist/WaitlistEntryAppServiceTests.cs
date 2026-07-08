using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Application.Contracts.Waitlist;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Waitlist;

public abstract class WaitlistEntryAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IWaitlistEntryAppService _waitlistEntryAppService;
    private readonly IPatientAppService _patientAppService;

    protected WaitlistEntryAppServiceTests()
    {
        _waitlistEntryAppService = GetRequiredService<IWaitlistEntryAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
    }

    private async Task<Guid> CreateTestPatientAsync()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Waitlist Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        return patient.Id;
    }

    [Fact]
    public async Task Should_Create_WaitlistEntry()
    {
        var patientId = await CreateTestPatientAsync();

        var result = await _waitlistEntryAppService.CreateAsync(new CreateUpdateWaitlistEntryDto
        {
            PatientId = patientId,
            PreferredTimeNote = "Sáng thứ 7",
            Notes = "Ưu tiên gọi trước"
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.PatientId.ShouldBe(patientId);
        result.PatientFullName.ShouldBe("Waitlist Test Patient");
        result.PreferredTimeNote.ShouldBe("Sáng thứ 7");
        result.Status.ShouldBe(WaitlistStatus.Waiting);
    }

    [Fact]
    public async Task Should_Not_Create_WaitlistEntry_For_NonExisting_Patient()
    {
        await Should.ThrowAsync<Exception>(async () =>
        {
            await _waitlistEntryAppService.CreateAsync(new CreateUpdateWaitlistEntryDto
            {
                PatientId = Guid.NewGuid()
            });
        });
    }

    [Fact]
    public async Task Should_Update_WaitlistEntry_Details()
    {
        var patientId = await CreateTestPatientAsync();
        var entry = await _waitlistEntryAppService.CreateAsync(new CreateUpdateWaitlistEntryDto
        {
            PatientId = patientId,
            PreferredTimeNote = "Sáng"
        });

        var updated = await _waitlistEntryAppService.UpdateAsync(entry.Id, new CreateUpdateWaitlistEntryDto
        {
            PatientId = patientId,
            PreferredTimeNote = "Chiều"
        });

        updated.PreferredTimeNote.ShouldBe("Chiều");
    }

    [Fact]
    public async Task Should_Change_Status()
    {
        var patientId = await CreateTestPatientAsync();
        var entry = await _waitlistEntryAppService.CreateAsync(new CreateUpdateWaitlistEntryDto
        {
            PatientId = patientId
        });

        var updated = await _waitlistEntryAppService.ChangeStatusAsync(entry.Id, new ChangeWaitlistEntryStatusDto
        {
            Status = WaitlistStatus.Scheduled
        });

        updated.Status.ShouldBe(WaitlistStatus.Scheduled);
    }

    [Fact]
    public async Task Should_Filter_By_Status()
    {
        var patientId = await CreateTestPatientAsync();
        var waiting = await _waitlistEntryAppService.CreateAsync(new CreateUpdateWaitlistEntryDto { PatientId = patientId });
        var cancelled = await _waitlistEntryAppService.CreateAsync(new CreateUpdateWaitlistEntryDto { PatientId = patientId });
        await _waitlistEntryAppService.ChangeStatusAsync(cancelled.Id, new ChangeWaitlistEntryStatusDto { Status = WaitlistStatus.Cancelled });

        var result = await _waitlistEntryAppService.GetListAsync(new GetWaitlistEntryListDto
        {
            Status = WaitlistStatus.Waiting,
            MaxResultCount = 100
        });

        result.Items.ShouldContain(x => x.Id == waiting.Id);
        result.Items.ShouldNotContain(x => x.Id == cancelled.Id);
    }

    [Fact]
    public async Task Should_Delete_WaitlistEntry()
    {
        var patientId = await CreateTestPatientAsync();
        var entry = await _waitlistEntryAppService.CreateAsync(new CreateUpdateWaitlistEntryDto { PatientId = patientId });

        await _waitlistEntryAppService.DeleteAsync(entry.Id);

        await Should.ThrowAsync<Exception>(async () => await _waitlistEntryAppService.GetAsync(entry.Id));
    }
}
