using System;
using GiapTech.Dentify.Appointments;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Notes { get; set; }
    public DateTime CreationTime { get; set; }
}
