using GiapTech.Dentify.Application.Contracts.Waitlist;
using GiapTech.Dentify.Waitlist;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Waitlist;

[Mapper]
public partial class WaitlistEntryMapper
{
    [MapperIgnoreTarget(nameof(WaitlistEntryDto.PatientFullName))]
    [MapperIgnoreTarget(nameof(WaitlistEntryDto.DoctorName))]
    [MapperIgnoreTarget(nameof(WaitlistEntryDto.ServiceName))]
    [MapperIgnoreSource(nameof(WaitlistEntry.ExtraProperties))]
    [MapperIgnoreSource(nameof(WaitlistEntry.ConcurrencyStamp))]
    public partial WaitlistEntryDto MapToDto(WaitlistEntry entry);
}
