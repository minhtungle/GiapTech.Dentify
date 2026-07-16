using System;

namespace GiapTech.Dentify.Application.Contracts.Statistics;

public class DoctorStatisticDto
{
    public Guid? DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int AppointmentCount { get; set; }
    public decimal TotalRevenue { get; set; }
}
