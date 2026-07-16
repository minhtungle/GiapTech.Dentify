using System;

namespace GiapTech.Dentify.Application.Contracts.Supplies;

public class SupplyUsageDto
{
    public Guid Id { get; set; }
    public Guid SupplyId { get; set; }
    public string SupplyName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public Guid? AppointmentId { get; set; }
    public DateTime UsedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreationTime { get; set; }
}
