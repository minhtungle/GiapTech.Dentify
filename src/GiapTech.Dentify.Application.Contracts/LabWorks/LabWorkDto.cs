using System;
using System.Collections.Generic;
using GiapTech.Dentify.LabWorks;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.LabWorks;

public class LabWorkDto : FullAuditedEntityDto<Guid>
{
    public Guid PatientId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public Guid? AppointmentId { get; set; }
    public DateTime? AppointmentScheduledDateTime { get; set; }
    public string LabName { get; set; } = string.Empty;
    public string WorkType { get; set; } = string.Empty;
    public List<int> ToothNumberList { get; set; } = new();
    public DateTime SentDate { get; set; }
    public DateTime? ExpectedReceiveDate { get; set; }
    public DateTime? ReceivedDate { get; set; }
    public decimal Cost { get; set; }
    public LabWorkStatus Status { get; set; }
    public string? Notes { get; set; }
}
