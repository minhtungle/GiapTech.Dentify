using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Chairs;

namespace GiapTech.Dentify.Application.Contracts.Chairs;

public class CreateUpdateChairDto
{
    [Required]
    [StringLength(ChairConsts.MaxNameLength)]
    public string Name { get; set; } = string.Empty;
}
