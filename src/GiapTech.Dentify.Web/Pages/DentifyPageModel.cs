using GiapTech.Dentify.Localization;
using Volo.Abp.AspNetCore.Mvc.UI.RazorPages;

namespace GiapTech.Dentify.Web.Pages;

public abstract class DentifyPageModel : AbpPageModel
{
    protected DentifyPageModel()
    {
        LocalizationResourceType = typeof(DentifyResource);
    }
}
