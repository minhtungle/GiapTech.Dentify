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
        patients.AddChild(DentifyPermissions.Patients.ManagePortalAccess, L("Permission:Patients.ManagePortalAccess"));

        var appointments = myGroup.AddPermission(DentifyPermissions.Appointments.Default, L("Permission:Appointments"));
        appointments.AddChild(DentifyPermissions.Appointments.Create, L("Permission:Appointments.Create"));
        appointments.AddChild(DentifyPermissions.Appointments.Update, L("Permission:Appointments.Update"));
        appointments.AddChild(DentifyPermissions.Appointments.Delete, L("Permission:Appointments.Delete"));
        appointments.AddChild(DentifyPermissions.Appointments.ManagePayment, L("Permission:Appointments.ManagePayment"));
        appointments.AddChild(DentifyPermissions.Appointments.ManageClinicalNotes, L("Permission:Appointments.ManageClinicalNotes"));

        var doctors = myGroup.AddPermission(DentifyPermissions.Doctors.Default, L("Permission:Doctors"));
        doctors.AddChild(DentifyPermissions.Doctors.Create, L("Permission:Doctors.Create"));
        doctors.AddChild(DentifyPermissions.Doctors.Update, L("Permission:Doctors.Update"));
        doctors.AddChild(DentifyPermissions.Doctors.Delete, L("Permission:Doctors.Delete"));

        var services = myGroup.AddPermission(DentifyPermissions.Services.Default, L("Permission:Services"));
        services.AddChild(DentifyPermissions.Services.Create, L("Permission:Services.Create"));
        services.AddChild(DentifyPermissions.Services.Update, L("Permission:Services.Update"));
        services.AddChild(DentifyPermissions.Services.Delete, L("Permission:Services.Delete"));

        var drugs = myGroup.AddPermission(DentifyPermissions.Drugs.Default, L("Permission:Drugs"));
        drugs.AddChild(DentifyPermissions.Drugs.Create, L("Permission:Drugs.Create"));
        drugs.AddChild(DentifyPermissions.Drugs.Update, L("Permission:Drugs.Update"));
        drugs.AddChild(DentifyPermissions.Drugs.Delete, L("Permission:Drugs.Delete"));

        var chairs = myGroup.AddPermission(DentifyPermissions.Chairs.Default, L("Permission:Chairs"));
        chairs.AddChild(DentifyPermissions.Chairs.Create, L("Permission:Chairs.Create"));
        chairs.AddChild(DentifyPermissions.Chairs.Update, L("Permission:Chairs.Update"));
        chairs.AddChild(DentifyPermissions.Chairs.Delete, L("Permission:Chairs.Delete"));

        var waitlist = myGroup.AddPermission(DentifyPermissions.Waitlist.Default, L("Permission:Waitlist"));
        waitlist.AddChild(DentifyPermissions.Waitlist.Create, L("Permission:Waitlist.Create"));
        waitlist.AddChild(DentifyPermissions.Waitlist.Update, L("Permission:Waitlist.Update"));
        waitlist.AddChild(DentifyPermissions.Waitlist.Delete, L("Permission:Waitlist.Delete"));

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

        var treatmentPlans = myGroup.AddPermission(DentifyPermissions.TreatmentPlans.Default, L("Permission:TreatmentPlans"));
        treatmentPlans.AddChild(DentifyPermissions.TreatmentPlans.Create, L("Permission:TreatmentPlans.Create"));
        treatmentPlans.AddChild(DentifyPermissions.TreatmentPlans.Update, L("Permission:TreatmentPlans.Update"));
        treatmentPlans.AddChild(DentifyPermissions.TreatmentPlans.Delete, L("Permission:TreatmentPlans.Delete"));

        var consentForms = myGroup.AddPermission(DentifyPermissions.ConsentForms.Default, L("Permission:ConsentForms"));
        consentForms.AddChild(DentifyPermissions.ConsentForms.Upload, L("Permission:ConsentForms.Upload"));
        consentForms.AddChild(DentifyPermissions.ConsentForms.Delete, L("Permission:ConsentForms.Delete"));

        var supplies = myGroup.AddPermission(DentifyPermissions.Supplies.Default, L("Permission:Supplies"));
        supplies.AddChild(DentifyPermissions.Supplies.Create, L("Permission:Supplies.Create"));
        supplies.AddChild(DentifyPermissions.Supplies.Update, L("Permission:Supplies.Update"));
        supplies.AddChild(DentifyPermissions.Supplies.Delete, L("Permission:Supplies.Delete"));

        var insurancePolicies = myGroup.AddPermission(DentifyPermissions.InsurancePolicies.Default, L("Permission:InsurancePolicies"));
        insurancePolicies.AddChild(DentifyPermissions.InsurancePolicies.Create, L("Permission:InsurancePolicies.Create"));
        insurancePolicies.AddChild(DentifyPermissions.InsurancePolicies.Update, L("Permission:InsurancePolicies.Update"));
        insurancePolicies.AddChild(DentifyPermissions.InsurancePolicies.Delete, L("Permission:InsurancePolicies.Delete"));

        myGroup.AddPermission(DentifyPermissions.PatientPortal.Default, L("Permission:PatientPortal"));

        var medicalTerms = myGroup.AddPermission(DentifyPermissions.MedicalTerms.Default, L("Permission:MedicalTerms"));
        medicalTerms.AddChild(DentifyPermissions.MedicalTerms.Create, L("Permission:MedicalTerms.Create"));
        medicalTerms.AddChild(DentifyPermissions.MedicalTerms.Update, L("Permission:MedicalTerms.Update"));
        medicalTerms.AddChild(DentifyPermissions.MedicalTerms.Delete, L("Permission:MedicalTerms.Delete"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<DentifyResource>(name);
    }
}
