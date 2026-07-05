using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Appointments;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Appointments;

[Mapper]
public partial class AppointmentMapper
{
    [MapperIgnoreTarget(nameof(AppointmentDto.PatientFullName))]
    [MapperIgnoreTarget(nameof(AppointmentDto.DoctorName))]
    [MapperIgnoreSource(nameof(Appointment.ExtraProperties))]
    [MapperIgnoreSource(nameof(Appointment.ConcurrencyStamp))]
    public partial AppointmentDto MapToDto(Appointment appointment);
}
