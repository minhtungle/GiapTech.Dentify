using System;
using GiapTech.Dentify.Waitlist;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Waitlist;

public class WaitlistEntryDto : FullAuditedEntityDto<Guid>
{
    public Guid PatientId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public Guid? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public Guid? ServiceId { get; set; }
    public string? ServiceName { get; set; }
    public string? PreferredTimeNote { get; set; }
    public string? Notes { get; set; }
    public WaitlistStatus Status { get; set; }
}
