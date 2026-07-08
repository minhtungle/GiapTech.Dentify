using System;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Settings;
using Microsoft.Extensions.Logging;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Emailing;

namespace GiapTech.Dentify.Application.Appointments;

/* Only sends email reminders; SMS is intentionally out of scope (no SMS provider
 * account/infrastructure available — see docs/PROGRESS.md Đợt 5). Extracted into an
 * AppService (rather than living inside the background worker) so the selection logic
 * is directly unit-testable without needing the worker's periodic-timer lifecycle.
 * RemoteService disabled — this runs only from the background worker, never as a public
 * HTTP endpoint (ABP auto-exposes every IApplicationService by convention otherwise). */
[RemoteService(IsEnabled = false)]
public class AppointmentReminderAppService : ApplicationService, IAppointmentReminderAppService
{
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly IEmailSender _emailSender;

    public AppointmentReminderAppService(
        IRepository<Appointment, Guid> appointmentRepository,
        IRepository<Patient, Guid> patientRepository,
        IEmailSender emailSender)
    {
        _appointmentRepository = appointmentRepository;
        _patientRepository = patientRepository;
        _emailSender = emailSender;
    }

    public virtual async Task<int> SendDueRemindersAsync()
    {
        var now = Clock.Now;
        var windowStart = now.AddHours(AppointmentReminderConsts.ReminderWindowStartHours);
        var windowEnd = now.AddHours(AppointmentReminderConsts.ReminderWindowEndHours);

        var queryable = await _appointmentRepository.GetQueryableAsync();
        var dueAppointments = await AsyncExecuter.ToListAsync(
            queryable.Where(a =>
                a.Status == AppointmentStatus.Scheduled &&
                a.ReminderSentAt == null &&
                a.ScheduledDateTime >= windowStart &&
                a.ScheduledDateTime < windowEnd));

        if (dueAppointments.Count == 0)
        {
            return 0;
        }

        var patientIds = dueAppointments.Select(a => a.PatientId).Distinct().ToList();
        var patientQueryable = await _patientRepository.GetQueryableAsync();
        var patients = await AsyncExecuter.ToListAsync(
            patientQueryable.Where(p => patientIds.Contains(p.Id)));
        var patientMap = patients.ToDictionary(p => p.Id, p => p);

        var clinicName = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.Name) ?? "Dentify";
        var sentCount = 0;

        foreach (var appointment in dueAppointments)
        {
            if (!patientMap.TryGetValue(appointment.PatientId, out var patient) ||
                string.IsNullOrWhiteSpace(patient.Email))
            {
                continue;
            }

            try
            {
                await _emailSender.SendAsync(
                    patient.Email,
                    $"Nhắc lịch hẹn tại {clinicName}",
                    BuildReminderBody(clinicName, patient.FullName, appointment.ScheduledDateTime),
                    isBodyHtml: false);

                appointment.MarkReminderSent(now);
                await _appointmentRepository.UpdateAsync(appointment);
                sentCount++;
            }
            catch (Exception ex)
            {
                Logger.LogWarning(
                    ex,
                    "Failed to send appointment reminder email for appointment {AppointmentId}",
                    appointment.Id);
            }
        }

        return sentCount;
    }

    private static string BuildReminderBody(string clinicName, string patientFullName, DateTime scheduledDateTime)
    {
        return $"Xin chào {patientFullName},\n\n" +
               $"Đây là email nhắc bạn có lịch hẹn tại {clinicName} vào lúc " +
               $"{scheduledDateTime:HH:mm 'ngày' dd/MM/yyyy}.\n\n" +
               "Vui lòng liên hệ phòng khám nếu cần đổi lịch.\n\n" +
               $"Trân trọng,\n{clinicName}";
    }
}
