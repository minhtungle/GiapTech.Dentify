using System.Threading.Tasks;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;

namespace GiapTech.Dentify.Web.Pages.Patients;

public class IndexModel : DentifyPageModel
{
    public bool CanCreate { get; set; }
    public bool CanUpdate { get; set; }
    public bool CanDelete { get; set; }

    public async Task OnGetAsync()
    {
        CanCreate = await AuthorizationService.IsGrantedAsync(DentifyPermissions.Patients.Create);
        CanUpdate = await AuthorizationService.IsGrantedAsync(DentifyPermissions.Patients.Update);
        CanDelete = await AuthorizationService.IsGrantedAsync(DentifyPermissions.Patients.Delete);
    }
}
