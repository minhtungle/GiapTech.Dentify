using System;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Doctors;

public class DoctorDto : FullAuditedEntityDto<Guid>
{
    public Guid IdentityUserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Specialization { get; set; }
    public bool IsActive { get; set; }
}
