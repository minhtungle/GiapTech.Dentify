using GiapTech.Dentify.Appointments;

namespace GiapTech.Dentify.Application.Contracts.Statistics;

public class TreatmentTypeStatisticDto
{
    public TreatmentType TreatmentType { get; set; }
    public int AppointmentCount { get; set; }
    public decimal TotalRevenue { get; set; }
}
