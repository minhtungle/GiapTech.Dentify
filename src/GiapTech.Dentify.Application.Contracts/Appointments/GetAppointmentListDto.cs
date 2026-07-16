using System;
using GiapTech.Dentify.Appointments;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class GetAppointmentListDto : PagedAndSortedResultRequestDto
{
    public Guid? PatientId { get; set; }
    public Guid? DoctorId { get; set; }
    public Guid? ServiceId { get; set; }
    public Guid? ChairId { get; set; }
    public AppointmentStatus? Status { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
