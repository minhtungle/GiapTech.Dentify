using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.LabWorks;

namespace GiapTech.Dentify.Application.Contracts.LabWorks;

public class CreateUpdateLabWorkDto
{
    [Required]
    public Guid PatientId { get; set; }

    public Guid? AppointmentId { get; set; }

    [Required]
    [StringLength(LabWorkConsts.MaxLabNameLength)]
    public string LabName { get; set; } = string.Empty;

    [Required]
    [StringLength(LabWorkConsts.MaxWorkTypeLength)]
    public string WorkType { get; set; } = string.Empty;

    public List<int> ToothNumberList { get; set; } = new();

    [Required]
    public DateTime SentDate { get; set; }

    public DateTime? ExpectedReceiveDate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Cost { get; set; }

    public LabWorkStatus Status { get; set; } = LabWorkStatus.Sent;

    [StringLength(LabWorkConsts.MaxNotesLength)]
    public string? Notes { get; set; }
}
