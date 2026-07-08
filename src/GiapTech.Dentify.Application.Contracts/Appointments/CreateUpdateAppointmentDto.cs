using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Appointments;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class CreateUpdateAppointmentDto
{
    [Required]
    public Guid PatientId { get; set; }

    public Guid? DoctorId { get; set; }

    public Guid? ServiceId { get; set; }

    public Guid? ChairId { get; set; }

    [Required]
    public DateTime ScheduledDateTime { get; set; }

    [Range(AppointmentConsts.MinDurationMinutes, AppointmentConsts.MaxDurationMinutes)]
    public int DurationMinutes { get; set; } = AppointmentConsts.DefaultDurationMinutes;

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;

    [StringLength(AppointmentConsts.MaxNotesLength)]
    public string? PreOpNotes { get; set; }

    [StringLength(AppointmentConsts.MaxNotesLength)]
    public string? PostOpNotes { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    public List<CreateUpdatePrescriptionItemDto> PrescriptionItems { get; set; } = new();
}
