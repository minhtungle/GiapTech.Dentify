using GiapTech.Dentify.Application.Contracts.LabWorks;
using GiapTech.Dentify.LabWorks;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.LabWorks;

[Mapper]
public partial class LabWorkMapper
{
    [MapperIgnoreTarget(nameof(LabWorkDto.PatientFullName))]
    [MapperIgnoreTarget(nameof(LabWorkDto.AppointmentScheduledDateTime))]
    [MapperIgnoreSource(nameof(LabWork.ExtraProperties))]
    [MapperIgnoreSource(nameof(LabWork.ConcurrencyStamp))]
    public partial LabWorkDto MapToDto(LabWork labWork);
}
