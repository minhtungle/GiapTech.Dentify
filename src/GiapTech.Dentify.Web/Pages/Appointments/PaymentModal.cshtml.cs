using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using Microsoft.AspNetCore.Mvc;

namespace GiapTech.Dentify.Web.Pages.Appointments;

public class PaymentModalModel : DentifyPageModel
{
    [BindProperty]
    public Guid Id { get; set; }

    [BindProperty]
    public UpdatePaymentDto Payment { get; set; } = new();

    public decimal Price { get; set; }

    private readonly IAppointmentAppService _appointmentAppService;

    public PaymentModalModel(IAppointmentAppService appointmentAppService)
    {
        _appointmentAppService = appointmentAppService;
    }

    public async Task OnGetAsync(Guid id)
    {
        Id = id;

        var appointment = await _appointmentAppService.GetAsync(id);
        Price = appointment.Price;
        Payment = new UpdatePaymentDto
        {
            PaidAmount = appointment.PaidAmount
        };
    }

    public async Task<IActionResult> OnPostAsync()
    {
        await _appointmentAppService.UpdatePaymentAsync(Id, Payment);
        return NoContent();
    }
}
