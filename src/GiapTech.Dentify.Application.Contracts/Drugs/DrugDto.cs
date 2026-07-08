using System;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Drugs;

public class DrugDto : FullAuditedEntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? DefaultDosage { get; set; }
    public bool IsActive { get; set; }
}
