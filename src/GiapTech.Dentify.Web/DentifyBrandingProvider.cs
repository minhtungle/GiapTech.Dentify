using Volo.Abp.Ui.Branding;
using Volo.Abp.DependencyInjection;
using Microsoft.Extensions.Localization;
using GiapTech.Dentify.Localization;

namespace GiapTech.Dentify.Web;

[Dependency(ReplaceServices = true)]
public class DentifyBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<DentifyResource> _localizer;

    public DentifyBrandingProvider(IStringLocalizer<DentifyResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
