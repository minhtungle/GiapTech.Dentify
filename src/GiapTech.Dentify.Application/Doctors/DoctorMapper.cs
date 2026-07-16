using GiapTech.Dentify.Application.Contracts.Doctors;
using GiapTech.Dentify.Doctors;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Doctors;

[Mapper]
public partial class DoctorMapper
{
    [MapperIgnoreTarget(nameof(DoctorDto.FullName))]
    [MapperIgnoreSource(nameof(Doctor.ExtraProperties))]
    [MapperIgnoreSource(nameof(Doctor.ConcurrencyStamp))]
    public partial DoctorDto MapToDto(Doctor doctor);
}
