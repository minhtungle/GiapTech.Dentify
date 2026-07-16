using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.PatientPortal;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.Security.Claims;
using Xunit;

namespace GiapTech.Dentify.PatientPortal;

public abstract class PatientPortalAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IPatientPortalAppService _patientPortalAppService;
    private readonly IPatientAppService _patientAppService;
    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IdentityUserManager _identityUserManager;
    private readonly ICurrentPrincipalAccessor _currentPrincipalAccessor;

    protected PatientPortalAppServiceTests()
    {
        _patientPortalAppService = GetRequiredService<IPatientPortalAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
        _identityUserManager = GetRequiredService<IdentityUserManager>();
        _currentPrincipalAccessor = GetRequiredService<ICurrentPrincipalAccessor>();
    }

    private async Task<(Guid PatientId, Guid IdentityUserId)> CreateLinkedPatientAsync(string userName, string fullName)
    {
        var user = new IdentityUser(Guid.NewGuid(), userName, $"{userName}@test.com");
        var createResult = await _identityUserManager.CreateAsync(user);
        createResult.Succeeded.ShouldBeTrue();

        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = fullName,
            DateOfBirth = new DateTime(1990, 1, 1)
        });

        await _patientAppService.LinkIdentityUserAsync(patient.Id, new LinkPatientIdentityUserDto
        {
            IdentityUserId = user.Id
        });

        return (patient.Id, user.Id);
    }

    private IDisposable ActAsUser(Guid identityUserId)
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(AbpClaimTypes.UserId, identityUserId.ToString())
        }));
        return _currentPrincipalAccessor.Change(principal);
    }

    [Fact]
    public async Task Should_Get_Own_Profile()
    {
        var (_, identityUserId) = await CreateLinkedPatientAsync("portal.profile", "Portal Profile Patient");

        using (ActAsUser(identityUserId))
        {
            var profile = await _patientPortalAppService.GetMyProfileAsync();
            profile.FullName.ShouldBe("Portal Profile Patient");
        }
    }

    [Fact]
    public async Task Should_Throw_When_Account_Not_Linked_To_Any_Patient()
    {
        var user = new IdentityUser(Guid.NewGuid(), "portal.unlinked", "portal.unlinked@test.com");
        (await _identityUserManager.CreateAsync(user)).Succeeded.ShouldBeTrue();

        using (ActAsUser(user.Id))
        {
            var exception = await Should.ThrowAsync<BusinessException>(async () =>
            {
                await _patientPortalAppService.GetMyProfileAsync();
            });

            exception.Code.ShouldBe(DentifyDomainErrorCodes.PatientPortalAccountNotLinked);
        }
    }

    [Fact]
    public async Task Should_Only_See_Own_Appointments_Not_Other_Patients()
    {
        var (patientAId, userAId) = await CreateLinkedPatientAsync("portal.patient.a", "Patient A");
        var (patientBId, _) = await CreateLinkedPatientAsync("portal.patient.b", "Patient B");

        var appointmentA = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientAId,
            ScheduledDateTime = DateTime.UtcNow.AddDays(1),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientBId,
            ScheduledDateTime = DateTime.UtcNow.AddDays(1),
            Status = AppointmentStatus.Scheduled,
            Price = 200
        });

        using (ActAsUser(userAId))
        {
            var myAppointments = await _patientPortalAppService.GetMyAppointmentsAsync(upcoming: true);

            myAppointments.ShouldContain(x => x.Id == appointmentA.Id);
            myAppointments.Count.ShouldBe(1);
        }
    }

    [Fact]
    public async Task Should_Calculate_Own_Balance_Correctly()
    {
        var (patientId, userId) = await CreateLinkedPatientAsync("portal.balance", "Balance Patient");

        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddDays(-1),
            Status = AppointmentStatus.Completed,
            Price = 500
        });
        await _appointmentAppService.AddPaymentAsync(appointment.Id, new CreatePaymentDto
        {
            Amount = 200,
            PaymentDate = DateTime.UtcNow
        });

        using (ActAsUser(userId))
        {
            var balance = await _patientPortalAppService.GetMyBalanceAsync();
            balance.TotalDebt.ShouldBe(300);
        }
    }

    [Fact]
    public async Task Should_Exclude_Cancelled_Appointments_From_Balance()
    {
        var (patientId, userId) = await CreateLinkedPatientAsync("portal.balance.cancelled", "Cancelled Balance Patient");

        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddDays(-1),
            Status = AppointmentStatus.Cancelled,
            Price = 500000
        });

        using (ActAsUser(userId))
        {
            var balance = await _patientPortalAppService.GetMyBalanceAsync();
            balance.TotalDebt.ShouldBe(0);
        }
    }

    [Fact]
    public async Task Should_List_Only_Completed_Appointments_In_Treatment_History()
    {
        var (patientId, userId) = await CreateLinkedPatientAsync("portal.history", "History Patient");

        var completed = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddDays(-5),
            Status = AppointmentStatus.Completed,
            Price = 100
        });
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddDays(3),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });

        using (ActAsUser(userId))
        {
            var history = await _patientPortalAppService.GetMyTreatmentHistoryAsync();

            history.ShouldContain(x => x.Id == completed.Id);
            history.Count.ShouldBe(1);
        }
    }
}
