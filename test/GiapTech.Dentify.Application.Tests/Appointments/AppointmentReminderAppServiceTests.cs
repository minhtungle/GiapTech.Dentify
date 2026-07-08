using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Appointments;

public abstract class AppointmentReminderAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IAppointmentReminderAppService _appointmentReminderAppService;
    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IPatientAppService _patientAppService;

    protected AppointmentReminderAppServiceTests()
    {
        _appointmentReminderAppService = GetRequiredService<IAppointmentReminderAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
    }

    private async Task<Guid> CreatePatientAsync(string fullName, string? email)
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = fullName,
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = email
        });
        return patient.Id;
    }

    [Fact]
    public async Task Should_Send_Reminder_For_Appointment_Due_In_23_To_24_Hours()
    {
        var patientId = await CreatePatientAsync("Reminder Due Patient", "due-patient@test.com");
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddHours(23.5),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });

        var sentCount = await _appointmentReminderAppService.SendDueRemindersAsync();

        sentCount.ShouldBe(1);
        var updated = await _appointmentAppService.GetAsync(appointment.Id);
        updated.ReminderSentAt.ShouldNotBeNull();
    }

    [Fact]
    public async Task Should_Not_Send_Reminder_Twice_For_Same_Appointment()
    {
        var patientId = await CreatePatientAsync("Reminder Once Patient", "once-patient@test.com");
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddHours(23.5),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });

        var firstRun = await _appointmentReminderAppService.SendDueRemindersAsync();
        var secondRun = await _appointmentReminderAppService.SendDueRemindersAsync();

        firstRun.ShouldBe(1);
        secondRun.ShouldBe(0);
    }

    [Fact]
    public async Task Should_Not_Send_Reminder_Outside_Window()
    {
        var patientId = await CreatePatientAsync("Reminder Too Early Patient", "too-early@test.com");
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddHours(48),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });

        var sentCount = await _appointmentReminderAppService.SendDueRemindersAsync();

        sentCount.ShouldBe(0);
    }

    [Fact]
    public async Task Should_Not_Send_Reminder_For_Cancelled_Appointment()
    {
        var patientId = await CreatePatientAsync("Reminder Cancelled Patient", "cancelled@test.com");
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddHours(23.5),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });
        await _appointmentAppService.UpdateAsync(appointment.Id, new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = appointment.ScheduledDateTime,
            Status = AppointmentStatus.Cancelled,
            Price = 100
        });

        var sentCount = await _appointmentReminderAppService.SendDueRemindersAsync();

        sentCount.ShouldBe(0);
    }

    [Fact]
    public async Task Should_Skip_Patient_Without_Email_Without_Throwing()
    {
        var patientId = await CreatePatientAsync("Reminder No Email Patient", null);
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.UtcNow.AddHours(23.5),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });

        var sentCount = await _appointmentReminderAppService.SendDueRemindersAsync();

        sentCount.ShouldBe(0);
    }
}
