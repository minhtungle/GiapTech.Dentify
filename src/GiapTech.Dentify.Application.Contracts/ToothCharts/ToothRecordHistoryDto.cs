using System;
using GiapTech.Dentify.ToothCharts;

namespace GiapTech.Dentify.Application.Contracts.ToothCharts;

public class ToothRecordHistoryDto
{
    public int ToothNumber { get; set; }
    public ToothStatus Status { get; set; }
    public string? Notes { get; set; }
    public Guid? AppointmentId { get; set; }
    public DateTime RecordedAt { get; set; }
}
