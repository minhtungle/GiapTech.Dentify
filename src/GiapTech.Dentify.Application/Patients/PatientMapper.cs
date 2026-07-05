using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Patients;

[Mapper]
public partial class PatientMapper
{
    [MapperIgnoreSource(nameof(Patient.ExtraProperties))]
    [MapperIgnoreSource(nameof(Patient.ConcurrencyStamp))]
    public partial PatientDto MapToDto(Patient patient);
}
