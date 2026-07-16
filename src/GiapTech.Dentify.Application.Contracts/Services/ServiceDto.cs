using System;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Services;

public class ServiceDto : FullAuditedEntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
}
