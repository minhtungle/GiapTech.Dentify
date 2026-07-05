using System.Threading.Tasks;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;

namespace GiapTech.Dentify.Web.Pages.Appointments;

public class IndexModel : DentifyPageModel
{
    public bool CanCreate { get; set; }
    public bool CanUpdate { get; set; }
    public bool CanDelete { get; set; }
    public bool CanManagePayment { get; set; }

    public async Task OnGetAsync()
    {
        CanCreate = await AuthorizationService.IsGrantedAsync(DentifyPermissions.Appointments.Create);
        CanUpdate = await AuthorizationService.IsGrantedAsync(DentifyPermissions.Appointments.Update);
        CanDelete = await AuthorizationService.IsGrantedAsync(DentifyPermissions.Appointments.Delete);
        CanManagePayment = await AuthorizationService.IsGrantedAsync(DentifyPermissions.Appointments.ManagePayment);
    }
}
