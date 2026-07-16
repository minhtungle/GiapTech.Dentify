using System;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Supplies;

public class SupplyDto : FullAuditedEntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal? LowStockThreshold { get; set; }
    public bool IsActive { get; set; }
}
