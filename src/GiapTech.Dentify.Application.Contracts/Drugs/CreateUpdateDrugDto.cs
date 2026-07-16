using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Drugs;

namespace GiapTech.Dentify.Application.Contracts.Drugs;

public class CreateUpdateDrugDto
{
    [Required]
    [StringLength(DrugConsts.MaxNameLength)]
    public string Name { get; set; } = string.Empty;

    [StringLength(DrugConsts.MaxDefaultDosageLength)]
    public string? DefaultDosage { get; set; }
}
