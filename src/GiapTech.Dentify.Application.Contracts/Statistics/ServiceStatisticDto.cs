using System;

namespace GiapTech.Dentify.Application.Contracts.Statistics;

public class ServiceStatisticDto
{
    public Guid? ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int AppointmentCount { get; set; }
    public decimal TotalRevenue { get; set; }
}
