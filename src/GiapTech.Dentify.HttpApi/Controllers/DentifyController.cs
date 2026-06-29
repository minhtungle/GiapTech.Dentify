using GiapTech.Dentify.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace GiapTech.Dentify.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class DentifyController : AbpControllerBase
{
    protected DentifyController()
    {
        LocalizationResource = typeof(DentifyResource);
    }
}
