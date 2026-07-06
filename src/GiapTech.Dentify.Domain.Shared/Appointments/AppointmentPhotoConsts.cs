namespace GiapTech.Dentify.Appointments;

public static class AppointmentPhotoConsts
{
    public const int MaxFileNameLength = 256;
    public const int MaxContentTypeLength = 128;
    public const long MaxSizeBytes = 10 * 1024 * 1024;

    public static readonly string[] AllowedContentTypes =
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    public const string BlobContainerName = "dentify-appointment-photos";
}
