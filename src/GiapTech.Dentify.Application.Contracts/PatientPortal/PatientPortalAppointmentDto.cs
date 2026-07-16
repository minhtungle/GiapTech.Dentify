using System;
using GiapTech.Dentify.Appointments;

namespace GiapTech.Dentify.Application.Contracts.PatientPortal;

public class PatientPortalAppointmentDto
{
    public Guid Id { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public AppointmentStatus Status { get; set; }
    public string? DoctorName { get; set; }
    public string? ServiceName { get; set; }
}
