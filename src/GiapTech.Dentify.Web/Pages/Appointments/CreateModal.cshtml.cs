using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Volo.Abp.Identity;

namespace GiapTech.Dentify.Web.Pages.Appointments;

public class CreateModalModel : DentifyPageModel
{
    [BindProperty]
    public CreateUpdateAppointmentDto Appointment { get; set; } = new();

    public List<SelectListItem> Patients { get; set; } = new();
    public List<SelectListItem> Doctors { get; set; } = new();
    public List<SelectListItem> Statuses { get; set; } = new();

    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IPatientAppService _patientAppService;
    private readonly IIdentityUserAppService _identityUserAppService;

    public CreateModalModel(
        IAppointmentAppService appointmentAppService,
        IPatientAppService patientAppService,
        IIdentityUserAppService identityUserAppService)
    {
        _appointmentAppService = appointmentAppService;
        _patientAppService = patientAppService;
        _identityUserAppService = identityUserAppService;
    }

    public async Task OnGetAsync()
    {
        await LoadSelectListsAsync();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        await _appointmentAppService.CreateAsync(Appointment);
        return NoContent();
    }

    private async Task LoadSelectListsAsync()
    {
        var patients = await _patientAppService.GetListAsync(new GetPatientListDto
        {
            MaxResultCount = 1000,
            Sorting = "FullName"
        });
        Patients = patients.Items
            .Select(p => new SelectListItem(p.FullName, p.Id.ToString()))
            .ToList();

        var users = await _identityUserAppService.GetListAsync(new GetIdentityUsersInput
        {
            MaxResultCount = 1000,
            Sorting = "Name"
        });
        Doctors = users.Items
            .Select(u => new SelectListItem(u.Name, u.Id.ToString()))
            .ToList();

        Statuses = Enum.GetValues<AppointmentStatus>()
            .Select(status => new SelectListItem(L[$"AppointmentStatus:{status}"].Value, status.ToString()))
            .ToList();
    }
}
