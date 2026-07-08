namespace GiapTech.Dentify.Settings;

public static class DentifySettings
{
    private const string Prefix = "Dentify";

    public static class Clinic
    {
        private const string GroupPrefix = Prefix + ".Clinic";

        public const string Name = GroupPrefix + ".Name";
        public const string Address = GroupPrefix + ".Address";
        public const string PhoneNumber = GroupPrefix + ".PhoneNumber";
        public const string LogoUrl = GroupPrefix + ".LogoUrl";
        public const string HasUploadedLogo = GroupPrefix + ".HasUploadedLogo";
        public const string ToothNotationSystem = GroupPrefix + ".ToothNotationSystem";
    }
}
