namespace GiapTech.Dentify.Settings;

public static class ClinicLogoConsts
{
    public const long MaxSizeBytes = 2 * 1024 * 1024;
    public const string BlobName = "logo";
    public const string BlobContainerName = "dentify-clinic-logo";

    public static readonly string[] AllowedContentTypes =
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };
}
