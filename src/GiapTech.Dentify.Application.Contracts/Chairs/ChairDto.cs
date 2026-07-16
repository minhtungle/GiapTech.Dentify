using System;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Chairs;

public class ChairDto : FullAuditedEntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
