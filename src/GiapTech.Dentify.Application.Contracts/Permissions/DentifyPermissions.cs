namespace GiapTech.Dentify.Permissions;

public static class DentifyPermissions
{
    public const string GroupName = "Dentify";

    public static class Patients
    {
        public const string Default = GroupName + ".Patients";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
        public const string ManagePortalAccess = Default + ".ManagePortalAccess";
    }

    public static class Appointments
    {
        public const string Default = GroupName + ".Appointments";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
        public const string ManagePayment = Default + ".ManagePayment";
        public const string ManageClinicalNotes = Default + ".ManageClinicalNotes";
    }

    public static class Doctors
    {
        public const string Default = GroupName + ".Doctors";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class Services
    {
        public const string Default = GroupName + ".Services";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class Drugs
    {
        public const string Default = GroupName + ".Drugs";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class Chairs
    {
        public const string Default = GroupName + ".Chairs";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class Waitlist
    {
        public const string Default = GroupName + ".Waitlist";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class ToothChart
    {
        public const string Default = GroupName + ".ToothChart";
        public const string Update = Default + ".Update";
    }

    public static class AppointmentPhotos
    {
        public const string Default = GroupName + ".AppointmentPhotos";
        public const string Upload = Default + ".Upload";
        public const string Delete = Default + ".Delete";
    }

    public static class LabWorks
    {
        public const string Default = GroupName + ".LabWorks";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class Expenses
    {
        public const string Default = GroupName + ".Expenses";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class ClinicSettings
    {
        public const string Default = GroupName + ".ClinicSettings";
        public const string Update = Default + ".Update";
    }

    public static class Tasks
    {
        public const string Default = GroupName + ".Tasks";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class Statistics
    {
        public const string Default = GroupName + ".Statistics";
    }

    public static class TreatmentPlans
    {
        public const string Default = GroupName + ".TreatmentPlans";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class ConsentForms
    {
        public const string Default = GroupName + ".ConsentForms";
        public const string Upload = Default + ".Upload";
        public const string Delete = Default + ".Delete";
    }

    public static class Supplies
    {
        public const string Default = GroupName + ".Supplies";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class InsurancePolicies
    {
        public const string Default = GroupName + ".InsurancePolicies";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
    }

    public static class PatientPortal
    {
        public const string Default = GroupName + ".PatientPortal";
    }
}
