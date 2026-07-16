using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.ToothCharts;

namespace GiapTech.Dentify.Application.Contracts.ToothCharts;

public class UpdateToothStatusDto
{
    [Required]
    public ToothStatus Status { get; set; }

    [StringLength(ToothChartConsts.MaxNotesLength)]
    public string? Notes { get; set; }

    public Guid? AppointmentId { get; set; }
}
