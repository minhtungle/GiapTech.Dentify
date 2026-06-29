using GiapTech.Dentify.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using Volo.Abp.MultiTenancy;

namespace GiapTech.Dentify.Permissions;

public class DentifyPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(DentifyPermissions.GroupName);

        //Define your own permissions here. Example:
        //myGroup.AddPermission(DentifyPermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<DentifyResource>(name);
    }
}
