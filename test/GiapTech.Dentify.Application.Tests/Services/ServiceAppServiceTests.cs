using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Application.Contracts.Services;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Services;

public abstract class ServiceAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IServiceAppService _serviceAppService;
    private readonly IPatientAppService _patientAppService;
    private readonly IAppointmentAppService _appointmentAppService;

    protected ServiceAppServiceTests()
    {
        _serviceAppService = GetRequiredService<IServiceAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
    }

    [Fact]
    public async Task Should_Create_Service()
    {
        var result = await _serviceAppService.CreateAsync(new CreateUpdateServiceDto
        {
            Name = "Trám răng thẩm mỹ",
            Price = 500000
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.Name.ShouldBe("Trám răng thẩm mỹ");
        result.Price.ShouldBe(500000);
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Update_Service_Price()
    {
        var service = await _serviceAppService.CreateAsync(new CreateUpdateServiceDto
        {
            Name = "Nhổ răng khôn",
            Price = 300000
        });

        var updated = await _serviceAppService.UpdateAsync(service.Id, new CreateUpdateServiceDto
        {
            Name = "Nhổ răng khôn",
            Price = 400000
        });

        updated.Price.ShouldBe(400000);
    }

    [Fact]
    public async Task Should_Only_List_Active_Services()
    {
        var active = await _serviceAppService.CreateAsync(new CreateUpdateServiceDto { Name = "Dịch vụ đang hoạt động", Price = 100000 });
        var inactive = await _serviceAppService.CreateAsync(new CreateUpdateServiceDto { Name = "Dịch vụ ngừng cung cấp", Price = 100000 });
        await _serviceAppService.DeactivateAsync(inactive.Id);

        var result = await _serviceAppService.GetActiveListAsync();

        result.ShouldContain(x => x.Id == active.Id);
        result.ShouldNotContain(x => x.Id == inactive.Id);
    }

    [Fact]
    public async Task Should_Reactivate_Service()
    {
        var service = await _serviceAppService.CreateAsync(new CreateUpdateServiceDto { Name = "Cạo vôi răng", Price = 200000 });

        await _serviceAppService.DeactivateAsync(service.Id);
        await _serviceAppService.ActivateAsync(service.Id);

        var result = await _serviceAppService.GetAsync(service.Id);
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Delete_Service()
    {
        var service = await _serviceAppService.CreateAsync(new CreateUpdateServiceDto { Name = "Dịch vụ sẽ xoá", Price = 100000 });

        await _serviceAppService.DeleteAsync(service.Id);

        await Should.ThrowAsync<Exception>(async () => await _serviceAppService.GetAsync(service.Id));
    }

    [Fact]
    public async Task Should_Not_Delete_Service_With_Existing_Appointments()
    {
        var service = await _serviceAppService.CreateAsync(new CreateUpdateServiceDto { Name = "Dịch vụ có lịch hẹn", Price = 100000 });

        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Service Delete Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });

        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patient.Id,
            ServiceId = service.Id,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            Price = 100000
        });

        await Should.ThrowAsync<BusinessException>(async () => await _serviceAppService.DeleteAsync(service.Id));
    }
}
