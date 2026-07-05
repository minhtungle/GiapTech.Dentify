using System.Threading.Tasks;
using GiapTech.Dentify.Localization;
using GiapTech.Dentify.Permissions;
using GiapTech.Dentify.MultiTenancy;
using Volo.Abp.SettingManagement.Web.Navigation;
using Volo.Abp.Authorization.Permissions;
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
        //Patients
        context.Menu.AddItem(
            new ApplicationMenuItem(
                DentifyMenus.Patients,
                l["Menu:Patients"],
                "~/Patients",
                icon: "fa fa-user",
                order: 2
            ).RequirePermissions(DentifyPermissions.Patients.Default)
        );
        //Appointments
        context.Menu.AddItem(
            new ApplicationMenuItem(
                DentifyMenus.Appointments,
                l["Menu:Appointments"],
                "~/Appointments",
                icon: "fa fa-calendar",
                order: 3
            ).RequirePermissions(DentifyPermissions.Appointments.Default)
        );
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
