using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Application.Contracts.Supplies;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Supplies;

public abstract class SupplyUsageAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly ISupplyUsageAppService _supplyUsageAppService;
    private readonly ISupplyAppService _supplyAppService;
    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IPatientAppService _patientAppService;

    protected SupplyUsageAppServiceTests()
    {
        _supplyUsageAppService = GetRequiredService<ISupplyUsageAppService>();
        _supplyAppService = GetRequiredService<ISupplyAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
    }

    private async Task<Guid> CreateStockedSupplyAsync(string name, decimal initialQuantity)
    {
        var supply = await _supplyAppService.CreateAsync(new CreateUpdateSupplyDto { Name = name, Unit = "ống" });
        await _supplyAppService.RestockAsync(supply.Id, new RestockSupplyDto { Quantity = initialQuantity });
        return supply.Id;
    }

    private async Task<Guid> CreateAppointmentAsync()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Supply Usage Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male
        });

        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patient.Id,
            ScheduledDateTime = DateTime.UtcNow.AddDays(1),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });

        return appointment.Id;
    }

    [Fact]
    public async Task Should_Record_Usage_And_Decrease_Supply_Quantity()
    {
        var supplyId = await CreateStockedSupplyAsync("Thuốc tê Lidocaine", 100);

        var usage = await _supplyUsageAppService.CreateAsync(new CreateSupplyUsageDto
        {
            SupplyId = supplyId,
            Quantity = 30,
            UsedAt = DateTime.UtcNow
        });

        usage.Id.ShouldNotBe(Guid.Empty);
        usage.Quantity.ShouldBe(30);

        var supply = await _supplyAppService.GetAsync(supplyId);
        supply.Quantity.ShouldBe(70);
    }

    [Fact]
    public async Task Should_Link_Usage_To_Appointment()
    {
        var supplyId = await CreateStockedSupplyAsync("Găng tay y tế", 50);
        var appointmentId = await CreateAppointmentAsync();

        var usage = await _supplyUsageAppService.CreateAsync(new CreateSupplyUsageDto
        {
            SupplyId = supplyId,
            Quantity = 2,
            AppointmentId = appointmentId,
            UsedAt = DateTime.UtcNow
        });

        usage.AppointmentId.ShouldBe(appointmentId);

        var list = await _supplyUsageAppService.GetListAsync(new GetSupplyUsageListDto { AppointmentId = appointmentId, MaxResultCount = 100 });
        list.Items.ShouldContain(x => x.Id == usage.Id);
    }

    [Fact]
    public async Task Should_Throw_BusinessException_When_Usage_Exceeds_Available_Quantity()
    {
        var supplyId = await CreateStockedSupplyAsync("Vật liệu trám Composite", 10);

        var exception = await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _supplyUsageAppService.CreateAsync(new CreateSupplyUsageDto
            {
                SupplyId = supplyId,
                Quantity = 20,
                UsedAt = DateTime.UtcNow
            });
        });

        exception.Code.ShouldBe(DentifyDomainErrorCodes.InsufficientSupplyQuantity);

        var supply = await _supplyAppService.GetAsync(supplyId);
        supply.Quantity.ShouldBe(10);
    }

    [Fact]
    public async Task Should_Restore_Quantity_When_Usage_Deleted()
    {
        var supplyId = await CreateStockedSupplyAsync("Chỉ khâu nha khoa", 40);

        var usage = await _supplyUsageAppService.CreateAsync(new CreateSupplyUsageDto
        {
            SupplyId = supplyId,
            Quantity = 15,
            UsedAt = DateTime.UtcNow
        });

        var afterUsage = await _supplyAppService.GetAsync(supplyId);
        afterUsage.Quantity.ShouldBe(25);

        await _supplyUsageAppService.DeleteAsync(usage.Id);

        var afterDelete = await _supplyAppService.GetAsync(supplyId);
        afterDelete.Quantity.ShouldBe(40);
    }

    [Fact]
    public async Task Should_Filter_UsageList_By_Supply()
    {
        var supplyAId = await CreateStockedSupplyAsync("Vật tư A", 100);
        var supplyBId = await CreateStockedSupplyAsync("Vật tư B", 100);

        var usageA = await _supplyUsageAppService.CreateAsync(new CreateSupplyUsageDto { SupplyId = supplyAId, Quantity = 5, UsedAt = DateTime.UtcNow });
        var usageB = await _supplyUsageAppService.CreateAsync(new CreateSupplyUsageDto { SupplyId = supplyBId, Quantity = 5, UsedAt = DateTime.UtcNow });

        var result = await _supplyUsageAppService.GetListAsync(new GetSupplyUsageListDto { SupplyId = supplyAId, MaxResultCount = 100 });

        result.Items.ShouldContain(x => x.Id == usageA.Id);
        result.Items.ShouldNotContain(x => x.Id == usageB.Id);
    }
}
