using System;
using GiapTech.Dentify.ToothCharts;

namespace GiapTech.Dentify.Application.Contracts.ToothCharts;

public class ToothRecordDto
{
    public int ToothNumber { get; set; }
    public ToothStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTime LastUpdated { get; set; }
    public Guid? UpdatedByAppointmentId { get; set; }
}
