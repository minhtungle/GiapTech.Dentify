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
    }

    public static class Appointments
    {
        public const string Default = GroupName + ".Appointments";
        public const string Create = Default + ".Create";
        public const string Update = Default + ".Update";
        public const string Delete = Default + ".Delete";
        public const string ManagePayment = Default + ".ManagePayment";
    }

    public static class ToothChart
    {
        public const string Default = GroupName + ".ToothChart";
        public const string Update = Default + ".Update";
    }
}
