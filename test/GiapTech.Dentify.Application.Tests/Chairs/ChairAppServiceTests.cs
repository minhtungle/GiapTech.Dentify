using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Chairs;
using GiapTech.Dentify.Application.Contracts.Patients;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Chairs;

public abstract class ChairAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IChairAppService _chairAppService;
    private readonly IPatientAppService _patientAppService;
    private readonly IAppointmentAppService _appointmentAppService;

    protected ChairAppServiceTests()
    {
        _chairAppService = GetRequiredService<IChairAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
    }

    [Fact]
    public async Task Should_Create_Chair()
    {
        var result = await _chairAppService.CreateAsync(new CreateUpdateChairDto { Name = "Ghế 1" });

        result.Id.ShouldNotBe(Guid.Empty);
        result.Name.ShouldBe("Ghế 1");
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Update_Chair_Name()
    {
        var chair = await _chairAppService.CreateAsync(new CreateUpdateChairDto { Name = "Ghế cũ" });

        var updated = await _chairAppService.UpdateAsync(chair.Id, new CreateUpdateChairDto { Name = "Ghế mới" });

        updated.Name.ShouldBe("Ghế mới");
    }

    [Fact]
    public async Task Should_Only_List_Active_Chairs()
    {
        var active = await _chairAppService.CreateAsync(new CreateUpdateChairDto { Name = "Ghế đang dùng" });
        var inactive = await _chairAppService.CreateAsync(new CreateUpdateChairDto { Name = "Ghế ngừng dùng" });
        await _chairAppService.DeactivateAsync(inactive.Id);

        var result = await _chairAppService.GetActiveListAsync();

        result.ShouldContain(x => x.Id == active.Id);
        result.ShouldNotContain(x => x.Id == inactive.Id);
    }

    [Fact]
    public async Task Should_Reactivate_Chair()
    {
        var chair = await _chairAppService.CreateAsync(new CreateUpdateChairDto { Name = "Ghế VIP" });

        await _chairAppService.DeactivateAsync(chair.Id);
        await _chairAppService.ActivateAsync(chair.Id);

        var result = await _chairAppService.GetAsync(chair.Id);
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Delete_Chair()
    {
        var chair = await _chairAppService.CreateAsync(new CreateUpdateChairDto { Name = "Ghế sẽ xoá" });

        await _chairAppService.DeleteAsync(chair.Id);

        await Should.ThrowAsync<Exception>(async () => await _chairAppService.GetAsync(chair.Id));
    }

    [Fact]
    public async Task Should_Not_Delete_Chair_With_Existing_Appointments()
    {
        var chair = await _chairAppService.CreateAsync(new CreateUpdateChairDto { Name = "Ghế có lịch hẹn" });

        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Chair Delete Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });

        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patient.Id,
            ChairId = chair.Id,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            Price = 100000
        });

        await Should.ThrowAsync<BusinessException>(async () => await _chairAppService.DeleteAsync(chair.Id));
    }
}
