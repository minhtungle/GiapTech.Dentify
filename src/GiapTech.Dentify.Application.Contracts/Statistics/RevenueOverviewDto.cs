using System.Collections.Generic;

namespace GiapTech.Dentify.Application.Contracts.Statistics;

public class RevenueOverviewDto
{
    public decimal CurrentPeriodTotal { get; set; }
    public decimal PreviousPeriodTotal { get; set; }
    public decimal GrowthPercentage { get; set; }
    public List<RevenuePointDto> Points { get; set; } = new();
}
