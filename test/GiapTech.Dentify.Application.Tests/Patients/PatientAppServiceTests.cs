using System;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp.Modularity;
using Volo.Abp.Validation;
using Xunit;

namespace GiapTech.Dentify.Patients;

public abstract class PatientAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IPatientAppService _patientAppService;
    private readonly IAppointmentAppService _appointmentAppService;

    protected PatientAppServiceTests()
    {
        _patientAppService = GetRequiredService<IPatientAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
    }

    [Fact]
    public async Task Should_Create_Patient()
    {
        var result = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Nguyen Van A",
            DateOfBirth = new DateTime(1990, 5, 1),
            Gender = Gender.Male,
            PhoneNumber = "0901234567",
            Tags = new() { "vip", "new" }
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.FullName.ShouldBe("Nguyen Van A");
        result.Tags.ShouldBe(new[] { "vip", "new" }, ignoreOrder: true);
        result.IsChildPatient.ShouldBeFalse();
    }

    [Fact]
    public async Task Should_Mark_Patient_As_Child_When_Under_Age_Threshold()
    {
        var result = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Be Con",
            DateOfBirth = DateTime.Today.AddYears(-5),
            Gender = Gender.Female
        });

        result.IsChildPatient.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Not_Create_Patient_With_Empty_Name()
    {
        await Should.ThrowAsync<AbpValidationException>(async () =>
        {
            await _patientAppService.CreateAsync(new CreateUpdatePatientDto
            {
                FullName = "",
                DateOfBirth = new DateTime(1990, 1, 1)
            });
        });
    }

    [Fact]
    public async Task Should_Update_Patient()
    {
        var created = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Old Name",
            DateOfBirth = new DateTime(1985, 3, 3)
        });

        var updated = await _patientAppService.UpdateAsync(created.Id, new CreateUpdatePatientDto
        {
            FullName = "New Name",
            DateOfBirth = new DateTime(1985, 3, 3),
            PhoneNumber = "0912345678"
        });

        updated.FullName.ShouldBe("New Name");
        updated.PhoneNumber.ShouldBe("0912345678");
    }

    [Fact]
    public async Task Should_Delete_Patient()
    {
        var created = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "To Be Deleted",
            DateOfBirth = new DateTime(1990, 1, 1)
        });

        await _patientAppService.DeleteAsync(created.Id);

        await Should.ThrowAsync<Exception>(async () => await _patientAppService.GetAsync(created.Id));
    }

    [Fact]
    public async Task Should_Filter_Patients_By_Name_And_Tag()
    {
        await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Tran Thi Filter",
            DateOfBirth = new DateTime(1995, 1, 1),
            Tags = new() { "priority" }
        });
        await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Someone Else",
            DateOfBirth = new DateTime(1995, 1, 1)
        });

        var byName = await _patientAppService.GetListAsync(new GetPatientListDto { Filter = "Filter" });
        byName.Items.ShouldContain(p => p.FullName == "Tran Thi Filter");
        byName.Items.ShouldNotContain(p => p.FullName == "Someone Else");

        var byTag = await _patientAppService.GetListAsync(new GetPatientListDto { Tag = "priority" });
        byTag.Items.ShouldContain(p => p.FullName == "Tran Thi Filter");
        byTag.Items.ShouldNotContain(p => p.FullName == "Someone Else");
    }

    [Fact]
    public async Task Should_Get_Patient_Detail_With_Last_Appointment_And_Total_Debt()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Debt Patient",
            DateOfBirth = new DateTime(1992, 1, 1)
        });

        var earlier = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patient.Id,
            ScheduledDateTime = DateTime.Now.AddDays(-10),
            Price = 100
        });
        await _appointmentAppService.UpdatePaymentAsync(earlier.Id, new UpdatePaymentDto { PaidAmount = 100 });

        var latest = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patient.Id,
            ScheduledDateTime = DateTime.Now.AddDays(-1),
            Price = 300
        });
        await _appointmentAppService.UpdatePaymentAsync(latest.Id, new UpdatePaymentDto { PaidAmount = 50 });

        var detail = await _patientAppService.GetPatientDetailAsync(patient.Id);

        detail.Patient.Id.ShouldBe(patient.Id);
        detail.LastAppointmentDate!.Value.Date.ShouldBe(latest.ScheduledDateTime.Date);
        detail.TotalDebt.ShouldBe(250); // (100-100) + (300-50)
    }
}
