using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Services;

namespace GiapTech.Dentify.Application.Contracts.Services;

public class CreateUpdateServiceDto
{
    [Required]
    [StringLength(ServiceConsts.MaxNameLength)]
    public string Name { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }
}
