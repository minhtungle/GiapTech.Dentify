using System.ComponentModel.DataAnnotations;

namespace GiapTech.Dentify.Application.Contracts.Supplies;

public class RestockSupplyDto
{
    [Range(0.0001, double.MaxValue)]
    public decimal Quantity { get; set; }
}
