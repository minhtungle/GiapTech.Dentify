using System;
using GiapTech.Dentify.MedicalTerms;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.MedicalTerms;

public class MedicalTermDto : FullAuditedEntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public MedicalTermCategory Category { get; set; }
    public bool IsActive { get; set; }
}
