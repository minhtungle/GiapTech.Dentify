using System.Threading.Tasks;
using GiapTech.Dentify.Localization;
using GiapTech.Dentify.MultiTenancy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Volo.Abp.SettingManagement.Web.Navigation;
using Volo.Abp.Identity.Web.Navigation;
using Volo.Abp.UI.Navigation;
using Volo.Abp.TenantManagement.Web.Navigation;
namespace GiapTech.Dentify.Web.Menus;

public class DentifyMenuContributor : IMenuContributor
{
    public async Task ConfigureMenuAsync(MenuConfigurationContext context)
    {
        if (context.Menu.Name == StandardMenus.Main)
        {
            await ConfigureMainMenuAsync(context);
        }
    }
    private static Task ConfigureMainMenuAsync(MenuConfigurationContext context)
    {
        var l = context.GetLocalizer<DentifyResource>();
        var configuration = context.ServiceProvider.GetRequiredService<IConfiguration>();

        //Home
        context.Menu.AddItem(
            new ApplicationMenuItem(
                DentifyMenus.Home,
                l["Menu:Home"],
                "~/",
                icon: "fa fa-home",
                order: 1
            )
        );

        //Link to the clinic app (React SPA) - business UI (Patients/Appointments/...) lives there.
        var clientUrl = configuration["App:ClientUrl"];
        if (!string.IsNullOrWhiteSpace(clientUrl))
        {
            context.Menu.AddItem(
                new ApplicationMenuItem(
                    DentifyMenus.ClinicApp,
                    l["Menu:ClinicApp"],
                    clientUrl,
                    icon: "fa fa-tooth",
                    order: 2,
                    target: "_blank"
                )
            );
        }

        //Administration
        var administration = context.Menu.GetAdministration();
        administration.Order = 6;
        //Administration->Identity
        administration.SetSubItemOrder(IdentityMenuNames.GroupName, 1);

        if (MultiTenancyConsts.IsEnabled)
        {
            administration.SetSubItemOrder(TenantManagementMenuNames.GroupName, 1);
        }
        else
        {
            administration.TryRemoveMenuItem(TenantManagementMenuNames.GroupName);
        }

        administration.SetSubItemOrder(SettingManagementMenuNames.GroupName, 3);
        //Administration->Settings
        administration.SetSubItemOrder(SettingManagementMenuNames.GroupName, 8);

        return Task.CompletedTask;
    }
}
