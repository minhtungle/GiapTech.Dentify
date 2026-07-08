using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Supplies;

namespace GiapTech.Dentify.Application.Contracts.Supplies;

public class CreateUpdateSupplyDto
{
    [Required]
    [StringLength(SupplyConsts.MaxNameLength)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(SupplyConsts.MaxUnitLength)]
    public string Unit { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal? LowStockThreshold { get; set; }
}
