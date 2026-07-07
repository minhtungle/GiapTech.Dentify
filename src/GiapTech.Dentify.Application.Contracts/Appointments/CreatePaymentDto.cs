using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Appointments;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class CreatePaymentDto
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;

    [StringLength(PaymentConsts.MaxNotesLength)]
    public string? Notes { get; set; }
}
