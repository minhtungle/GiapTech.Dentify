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

        var toothChart = myGroup.AddPermission(DentifyPermissions.ToothChart.Default, L("Permission:ToothChart"));
        toothChart.AddChild(DentifyPermissions.ToothChart.Update, L("Permission:ToothChart.Update"));

        var appointmentPhotos = myGroup.AddPermission(DentifyPermissions.AppointmentPhotos.Default, L("Permission:AppointmentPhotos"));
        appointmentPhotos.AddChild(DentifyPermissions.AppointmentPhotos.Upload, L("Permission:AppointmentPhotos.Upload"));
        appointmentPhotos.AddChild(DentifyPermissions.AppointmentPhotos.Delete, L("Permission:AppointmentPhotos.Delete"));

        var labWorks = myGroup.AddPermission(DentifyPermissions.LabWorks.Default, L("Permission:LabWorks"));
        labWorks.AddChild(DentifyPermissions.LabWorks.Create, L("Permission:LabWorks.Create"));
        labWorks.AddChild(DentifyPermissions.LabWorks.Update, L("Permission:LabWorks.Update"));
        labWorks.AddChild(DentifyPermissions.LabWorks.Delete, L("Permission:LabWorks.Delete"));

        var expenses = myGroup.AddPermission(DentifyPermissions.Expenses.Default, L("Permission:Expenses"));
        expenses.AddChild(DentifyPermissions.Expenses.Create, L("Permission:Expenses.Create"));
        expenses.AddChild(DentifyPermissions.Expenses.Update, L("Permission:Expenses.Update"));
        expenses.AddChild(DentifyPermissions.Expenses.Delete, L("Permission:Expenses.Delete"));

        var clinicSettings = myGroup.AddPermission(DentifyPermissions.ClinicSettings.Default, L("Permission:ClinicSettings"));
        clinicSettings.AddChild(DentifyPermissions.ClinicSettings.Update, L("Permission:ClinicSettings.Update"));

        var tasks = myGroup.AddPermission(DentifyPermissions.Tasks.Default, L("Permission:Tasks"));
        tasks.AddChild(DentifyPermissions.Tasks.Create, L("Permission:Tasks.Create"));
        tasks.AddChild(DentifyPermissions.Tasks.Update, L("Permission:Tasks.Update"));
        tasks.AddChild(DentifyPermissions.Tasks.Delete, L("Permission:Tasks.Delete"));

        myGroup.AddPermission(DentifyPermissions.Statistics.Default, L("Permission:Statistics"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<DentifyResource>(name);
    }
}
