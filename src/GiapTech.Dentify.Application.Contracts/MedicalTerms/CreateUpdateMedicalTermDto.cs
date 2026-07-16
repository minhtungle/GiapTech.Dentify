using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.MedicalTerms;

namespace GiapTech.Dentify.Application.Contracts.MedicalTerms;

public class CreateUpdateMedicalTermDto
{
    [Required]
    [StringLength(MedicalTermConsts.MaxNameLength)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public MedicalTermCategory Category { get; set; }
}
