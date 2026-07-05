using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Appointments;

public abstract class AppointmentAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IPatientAppService _patientAppService;

    protected AppointmentAppServiceTests()
    {
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
    }

    private async Task<Guid> CreateTestPatientAsync()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Appointment Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        return patient.Id;
    }

    [Fact]
    public async Task Should_Create_Appointment()
    {
        var patientId = await CreateTestPatientAsync();

        var result = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            Price = 500000
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.PatientFullName.ShouldBe("Appointment Test Patient");
        result.Status.ShouldBe(AppointmentStatus.Scheduled);
        result.PaymentStatus.ShouldBe(PaymentStatus.Unpaid);
    }

    [Fact]
    public async Task Should_Not_Create_Appointment_For_NonExisting_Patient()
    {
        await Should.ThrowAsync<Exception>(async () =>
        {
            await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
            {
                PatientId = Guid.NewGuid(),
                ScheduledDateTime = DateTime.Now,
                Price = 100
            });
        });
    }

    [Fact]
    public async Task Should_Update_Payment_And_Recalculate_Payment_Status()
    {
        var patientId = await CreateTestPatientAsync();
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now,
            Price = 1000
        });

        var partiallyPaid = await _appointmentAppService.UpdatePaymentAsync(appointment.Id, new UpdatePaymentDto { PaidAmount = 400 });
        partiallyPaid.PaymentStatus.ShouldBe(PaymentStatus.PartiallyPaid);

        var fullyPaid = await _appointmentAppService.UpdatePaymentAsync(appointment.Id, new UpdatePaymentDto { PaidAmount = 1000 });
        fullyPaid.PaymentStatus.ShouldBe(PaymentStatus.Paid);
    }

    [Fact]
    public async Task Should_Not_Allow_Payment_Exceeding_Price()
    {
        var patientId = await CreateTestPatientAsync();
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now,
            Price = 100
        });

        await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _appointmentAppService.UpdatePaymentAsync(appointment.Id, new UpdatePaymentDto { PaidAmount = 200 });
        });
    }

    [Fact]
    public async Task Should_Get_Calendar_View_Within_Date_Range()
    {
        var patientId = await CreateTestPatientAsync();
        var inRange = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = new DateTime(2030, 6, 15),
            Price = 100
        });
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = new DateTime(2031, 1, 1),
            Price = 100
        });

        var result = await _appointmentAppService.GetCalendarViewAsync(
            new DateTime(2030, 6, 1), new DateTime(2030, 6, 30));

        result.ShouldContain(a => a.Id == inRange.Id);
        result.Count.ShouldBe(1);
    }

    [Fact]
    public async Task Should_Delete_Appointment()
    {
        var patientId = await CreateTestPatientAsync();
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now,
            Price = 100
        });

        await _appointmentAppService.DeleteAsync(appointment.Id);

        await Should.ThrowAsync<Exception>(async () => await _appointmentAppService.GetAsync(appointment.Id));
    }
}
