using GiapTech.Dentify.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using Volo.Abp.MultiTenancy;

namespace GiapTech.Dentify.Permissions;

public class DentifyPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(DentifyPermissions.GroupName, L("Permission:Dentify"));

        var patients = myGroup.AddPermission(DentifyPermissions.Patients.Default, L("Permission:Patients"));
        patients.AddChild(DentifyPermissions.Patients.Create, L("Permission:Patients.Create"));
        patients.AddChild(DentifyPermissions.Patients.Update, L("Permission:Patients.Update"));
        patients.AddChild(DentifyPermissions.Patients.Delete, L("Permission:Patients.Delete"));

        var appointments = myGroup.AddPermission(DentifyPermissions.Appointments.Default, L("Permission:Appointments"));
        appointments.AddChild(DentifyPermissions.Appointments.Create, L("Permission:Appointments.Create"));
        appointments.AddChild(DentifyPermissions.Appointments.Update, L("Permission:Appointments.Update"));
        appointments.AddChild(DentifyPermissions.Appointments.Delete, L("Permission:Appointments.Delete"));
        appointments.AddChild(DentifyPermissions.Appointments.ManagePayment, L("Permission:Appointments.ManagePayment"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<DentifyResource>(name);
    }
}
