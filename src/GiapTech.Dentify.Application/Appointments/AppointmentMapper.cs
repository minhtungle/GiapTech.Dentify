using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Appointments;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Appointments;

[Mapper]
public partial class AppointmentMapper
{
    [MapperIgnoreTarget(nameof(AppointmentDto.PatientFullName))]
    [MapperIgnoreTarget(nameof(AppointmentDto.DoctorName))]
    [MapperIgnoreTarget(nameof(AppointmentDto.ServiceName))]
    [MapperIgnoreTarget(nameof(AppointmentDto.ChairName))]
    [MapperIgnoreSource(nameof(Appointment.ExtraProperties))]
    [MapperIgnoreSource(nameof(Appointment.ConcurrencyStamp))]
    public partial AppointmentDto MapToDto(Appointment appointment);

    public partial PrescriptionItemDto MapToDto(PrescriptionItem prescriptionItem);

    [MapperIgnoreSource(nameof(Payment.CreatorId))]
    public partial PaymentDto MapToDto(Payment payment);
}
