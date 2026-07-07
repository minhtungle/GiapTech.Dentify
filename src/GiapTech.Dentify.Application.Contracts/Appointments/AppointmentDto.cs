using System;
using System.Collections.Generic;
using GiapTech.Dentify.Appointments;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class AppointmentDto : FullAuditedEntityDto<Guid>
{
    public Guid PatientId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public Guid? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public DateTime ScheduledDateTime { get; set; }
    public AppointmentStatus Status { get; set; }
    public TreatmentType TreatmentType { get; set; }
    public string? PreOpNotes { get; set; }
    public string? PostOpNotes { get; set; }
    public decimal Price { get; set; }
    public decimal PaidAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public List<PrescriptionItemDto> PrescriptionItems { get; set; } = new();
    public List<PaymentDto> Payments { get; set; } = new();
}
