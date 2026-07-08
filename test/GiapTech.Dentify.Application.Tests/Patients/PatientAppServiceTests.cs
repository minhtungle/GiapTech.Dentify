using System;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.Validation;
using Xunit;

namespace GiapTech.Dentify.Patients;

public abstract class PatientAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IPatientAppService _patientAppService;
    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IdentityUserManager _identityUserManager;

    protected PatientAppServiceTests()
    {
        _patientAppService = GetRequiredService<IPatientAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
        _identityUserManager = GetRequiredService<IdentityUserManager>();
    }

    private async Task<Guid> CreateTestUserAsync(string userName)
    {
        var user = new IdentityUser(Guid.NewGuid(), userName, $"{userName}@test.com");
        var result = await _identityUserManager.CreateAsync(user);
        result.Succeeded.ShouldBeTrue();
        return user.Id;
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
        await _appointmentAppService.AddPaymentAsync(earlier.Id, new CreatePaymentDto { Amount = 100, PaymentDate = DateTime.Now });

        var latest = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patient.Id,
            ScheduledDateTime = DateTime.Now.AddDays(-1),
            Price = 300
        });
        await _appointmentAppService.AddPaymentAsync(latest.Id, new CreatePaymentDto { Amount = 50, PaymentDate = DateTime.Now });

        var detail = await _patientAppService.GetPatientDetailAsync(patient.Id);

        detail.Patient.Id.ShouldBe(patient.Id);
        detail.LastAppointmentDate!.Value.Date.ShouldBe(latest.ScheduledDateTime.Date);
        detail.TotalDebt.ShouldBe(250); // (100-100) + (300-50)
    }

    [Fact]
    public async Task Should_Create_Patient_With_Allergies_And_Medical_Conditions()
    {
        var result = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Allergic Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Allergies = new() { "Penicillin", "Latex" },
            MedicalConditions = new() { "Hypertension" }
        });

        result.Allergies.ShouldBe(new[] { "Penicillin", "Latex" }, ignoreOrder: true);
        result.MedicalConditions.ShouldBe(new[] { "Hypertension" });
    }

    [Fact]
    public async Task Should_Count_NoShow_Appointments_In_Patient_Detail()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "NoShow Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });

        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patient.Id,
            ScheduledDateTime = DateTime.Now.AddDays(-5),
            Price = 100,
            Status = AppointmentStatus.NoShow
        });

        var detail = await _patientAppService.GetPatientDetailAsync(patient.Id);

        detail.NoShowCount.ShouldBe(1);
    }

    [Fact]
    public async Task Should_Include_Patient_In_Recall_List_When_Completed_Long_Ago_Without_Upcoming_Appointment()
    {
        var recallPatient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Recall Due Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = recallPatient.Id,
            ScheduledDateTime = DateTime.Now.AddMonths(-8),
            Price = 100,
            Status = AppointmentStatus.Completed
        });

        var recentPatient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Recently Seen Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = recentPatient.Id,
            ScheduledDateTime = DateTime.Now.AddMonths(-1),
            Price = 100,
            Status = AppointmentStatus.Completed
        });

        var upcomingPatient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Already Booked Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = upcomingPatient.Id,
            ScheduledDateTime = DateTime.Now.AddMonths(-8),
            Price = 100,
            Status = AppointmentStatus.Completed
        });
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = upcomingPatient.Id,
            ScheduledDateTime = DateTime.Now.AddDays(5),
            Price = 100,
            Status = AppointmentStatus.Scheduled
        });

        var recallList = await _patientAppService.GetRecallListAsync(6);

        recallList.ShouldContain(x => x.PatientId == recallPatient.Id);
        recallList.ShouldNotContain(x => x.PatientId == recentPatient.Id);
        recallList.ShouldNotContain(x => x.PatientId == upcomingPatient.Id);
    }

    [Fact]
    public async Task Should_Set_ReferralSource()
    {
        var result = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Referral Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            ReferralSource = "Bạn bè giới thiệu"
        });

        result.ReferralSource.ShouldBe("Bạn bè giới thiệu");
    }

    [Fact]
    public async Task Should_Update_ReferralSource()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Referral Update Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            ReferralSource = "Facebook"
        });

        var updated = await _patientAppService.UpdateAsync(patient.Id, new CreateUpdatePatientDto
        {
            FullName = patient.FullName,
            DateOfBirth = patient.DateOfBirth,
            ReferralSource = "Google"
        });

        updated.ReferralSource.ShouldBe("Google");
    }

    [Fact]
    public async Task Should_Link_Patient_To_IdentityUser()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Portal Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        var userId = await CreateTestUserAsync("portal.patient.link");

        var linked = await _patientAppService.LinkIdentityUserAsync(patient.Id, new LinkPatientIdentityUserDto
        {
            IdentityUserId = userId
        });

        linked.IdentityUserId.ShouldBe(userId);
    }

    [Fact]
    public async Task Should_Not_Link_Same_User_To_Two_Patients()
    {
        var userId = await CreateTestUserAsync("portal.patient.duplicate");
        var patientA = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Patient A",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        var patientB = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Patient B",
            DateOfBirth = new DateTime(1990, 1, 1)
        });

        await _patientAppService.LinkIdentityUserAsync(patientA.Id, new LinkPatientIdentityUserDto { IdentityUserId = userId });

        await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _patientAppService.LinkIdentityUserAsync(patientB.Id, new LinkPatientIdentityUserDto { IdentityUserId = userId });
        });
    }

    [Fact]
    public async Task Should_Unlink_Patient_From_IdentityUser()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Portal Patient Unlink",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        var userId = await CreateTestUserAsync("portal.patient.unlink");
        await _patientAppService.LinkIdentityUserAsync(patient.Id, new LinkPatientIdentityUserDto { IdentityUserId = userId });

        var unlinked = await _patientAppService.UnlinkIdentityUserAsync(patient.Id);

        unlinked.IdentityUserId.ShouldBeNull();
    }
}
