using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Application.Contracts.Services;
using GiapTech.Dentify.Application.Contracts.TreatmentPlans;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.TreatmentPlans;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.TreatmentPlans;

public abstract class TreatmentPlanAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly ITreatmentPlanAppService _treatmentPlanAppService;
    private readonly IPatientAppService _patientAppService;
    private readonly IServiceAppService _serviceAppService;
    private readonly IAppointmentAppService _appointmentAppService;

    protected TreatmentPlanAppServiceTests()
    {
        _treatmentPlanAppService = GetRequiredService<ITreatmentPlanAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
        _serviceAppService = GetRequiredService<IServiceAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
    }

    private async Task<Guid> CreateTestPatientAsync()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Treatment Plan Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male
        });
        return patient.Id;
    }

    private async Task<Guid> CreateTestServiceAsync(string name)
    {
        var service = await _serviceAppService.CreateAsync(new CreateUpdateServiceDto { Name = name, Price = 500000 });
        return service.Id;
    }

    private async Task<Guid> CreateTestAppointmentAsync(Guid patientId)
    {
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddDays(1),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });
        return appointment.Id;
    }

    [Fact]
    public async Task Should_Create_TreatmentPlan_With_Items()
    {
        var patientId = await CreateTestPatientAsync();
        var serviceId = await CreateTestServiceAsync("Nhổ răng khôn");

        var result = await _treatmentPlanAppService.CreateAsync(new CreateUpdateTreatmentPlanDto
        {
            PatientId = patientId,
            Title = "Kế hoạch chỉnh nha 2026",
            Items = new List<CreateUpdateTreatmentPlanItemDto>
            {
                new() { StepOrder = 1, Description = "Nhổ răng khôn trước khi niềng", EstimatedCost = 1000000, ServiceId = serviceId },
                new() { StepOrder = 2, Description = "Gắn mắc cài", EstimatedCost = 15000000 }
            }
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.PatientFullName.ShouldBe("Treatment Plan Test Patient");
        result.Status.ShouldBe(TreatmentPlanStatus.Draft);
        result.Items.Count.ShouldBe(2);
        result.Items.ShouldContain(x => x.Description == "Nhổ răng khôn trước khi niềng" && x.ServiceId == serviceId);
    }

    [Fact]
    public async Task Should_Update_Items_Add_Edit_Remove()
    {
        var patientId = await CreateTestPatientAsync();
        var created = await _treatmentPlanAppService.CreateAsync(new CreateUpdateTreatmentPlanDto
        {
            PatientId = patientId,
            Title = "Kế hoạch test",
            Items = new List<CreateUpdateTreatmentPlanItemDto>
            {
                new() { StepOrder = 1, Description = "Bước 1", EstimatedCost = 100 },
                new() { StepOrder = 2, Description = "Bước sẽ bị xoá", EstimatedCost = 200 }
            }
        });

        var toKeep = created.Items.Single(x => x.Description == "Bước 1");

        var updated = await _treatmentPlanAppService.UpdateAsync(created.Id, new CreateUpdateTreatmentPlanDto
        {
            PatientId = patientId,
            Title = "Kế hoạch test",
            Items = new List<CreateUpdateTreatmentPlanItemDto>
            {
                new() { Id = toKeep.Id, StepOrder = 1, Description = "Bước 1 sửa", EstimatedCost = 150 },
                new() { StepOrder = 2, Description = "Bước mới", EstimatedCost = 300 }
            }
        });

        updated.Items.Count.ShouldBe(2);
        updated.Items.ShouldContain(x => x.Id == toKeep.Id && x.Description == "Bước 1 sửa" && x.EstimatedCost == 150);
        updated.Items.ShouldContain(x => x.Description == "Bước mới");
        updated.Items.ShouldNotContain(x => x.Description == "Bước sẽ bị xoá");
    }

    [Fact]
    public async Task Should_Change_TreatmentPlan_Status()
    {
        var patientId = await CreateTestPatientAsync();
        var plan = await _treatmentPlanAppService.CreateAsync(new CreateUpdateTreatmentPlanDto
        {
            PatientId = patientId,
            Title = "Kế hoạch"
        });

        var updated = await _treatmentPlanAppService.ChangeStatusAsync(plan.Id, new ChangeTreatmentPlanStatusDto
        {
            Status = TreatmentPlanStatus.Active
        });

        updated.Status.ShouldBe(TreatmentPlanStatus.Active);
    }

    [Fact]
    public async Task Should_Change_Item_Status()
    {
        var patientId = await CreateTestPatientAsync();
        var plan = await _treatmentPlanAppService.CreateAsync(new CreateUpdateTreatmentPlanDto
        {
            PatientId = patientId,
            Title = "Kế hoạch",
            Items = new List<CreateUpdateTreatmentPlanItemDto>
            {
                new() { StepOrder = 1, Description = "Bước 1", EstimatedCost = 100 }
            }
        });
        var item = plan.Items.Single();

        var updated = await _treatmentPlanAppService.ChangeItemStatusAsync(plan.Id, item.Id, new ChangeTreatmentPlanItemStatusDto
        {
            Status = TreatmentPlanItemStatus.Completed
        });

        updated.Items.Single().Status.ShouldBe(TreatmentPlanItemStatus.Completed);
    }

    [Fact]
    public async Task Should_Filter_By_Patient_And_Status()
    {
        var patientId = await CreateTestPatientAsync();
        var draft = await _treatmentPlanAppService.CreateAsync(new CreateUpdateTreatmentPlanDto { PatientId = patientId, Title = "Draft plan" });
        var active = await _treatmentPlanAppService.CreateAsync(new CreateUpdateTreatmentPlanDto { PatientId = patientId, Title = "Active plan" });
        await _treatmentPlanAppService.ChangeStatusAsync(active.Id, new ChangeTreatmentPlanStatusDto { Status = TreatmentPlanStatus.Active });

        var result = await _treatmentPlanAppService.GetListAsync(new GetTreatmentPlanListDto
        {
            PatientId = patientId,
            Status = TreatmentPlanStatus.Active,
            MaxResultCount = 100
        });

        result.Items.ShouldContain(x => x.Id == active.Id);
        result.Items.ShouldNotContain(x => x.Id == draft.Id);
    }

    [Fact]
    public async Task Should_Delete_TreatmentPlan()
    {
        var patientId = await CreateTestPatientAsync();
        var plan = await _treatmentPlanAppService.CreateAsync(new CreateUpdateTreatmentPlanDto { PatientId = patientId, Title = "Sẽ xoá" });

        await _treatmentPlanAppService.DeleteAsync(plan.Id);

        await Should.ThrowAsync<Exception>(async () => await _treatmentPlanAppService.GetAsync(plan.Id));
    }

    [Fact]
    public async Task Should_Link_Item_To_Appointment()
    {
        var patientId = await CreateTestPatientAsync();
        var appointmentId = await CreateTestAppointmentAsync(patientId);
        var plan = await _treatmentPlanAppService.CreateAsync(new CreateUpdateTreatmentPlanDto
        {
            PatientId = patientId,
            Title = "Kế hoạch",
            Items = new List<CreateUpdateTreatmentPlanItemDto>
            {
                new() { StepOrder = 1, Description = "Bước 1", EstimatedCost = 100 }
            }
        });
        var item = plan.Items.Single();

        var linked = await _treatmentPlanAppService.LinkItemToAppointmentAsync(
            plan.Id,
            item.Id,
            new LinkTreatmentPlanItemToAppointmentDto { AppointmentId = appointmentId });

        linked.Items.Single().AppointmentId.ShouldBe(appointmentId);

        var unlinked = await _treatmentPlanAppService.LinkItemToAppointmentAsync(
            plan.Id,
            item.Id,
            new LinkTreatmentPlanItemToAppointmentDto { AppointmentId = null });

        unlinked.Items.Single().AppointmentId.ShouldBeNull();
    }

    [Fact]
    public async Task Should_Not_Link_Item_To_Appointment_Of_Different_Patient()
    {
        var patientId = await CreateTestPatientAsync();
        var otherPatientId = await CreateTestPatientAsync();
        var otherPatientAppointmentId = await CreateTestAppointmentAsync(otherPatientId);

        var plan = await _treatmentPlanAppService.CreateAsync(new CreateUpdateTreatmentPlanDto
        {
            PatientId = patientId,
            Title = "Kế hoạch",
            Items = new List<CreateUpdateTreatmentPlanItemDto>
            {
                new() { StepOrder = 1, Description = "Bước 1", EstimatedCost = 100 }
            }
        });
        var item = plan.Items.Single();

        var exception = await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _treatmentPlanAppService.LinkItemToAppointmentAsync(
                plan.Id,
                item.Id,
                new LinkTreatmentPlanItemToAppointmentDto { AppointmentId = otherPatientAppointmentId });
        });

        exception.Code.ShouldBe(DentifyDomainErrorCodes.AppointmentBelongsToDifferentPatient);
    }
}
