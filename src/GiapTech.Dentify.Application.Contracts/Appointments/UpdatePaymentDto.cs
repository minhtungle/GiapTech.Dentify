using System.ComponentModel.DataAnnotations;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class UpdatePaymentDto
{
    [Range(0, double.MaxValue)]
    public decimal PaidAmount { get; set; }
}
