using GiapTech.Dentify.Localization;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify;

/* Inherit your application services from this class.
 */
public abstract class DentifyAppService : ApplicationService
{
    protected DentifyAppService()
    {
        LocalizationResource = typeof(DentifyResource);
    }
}
