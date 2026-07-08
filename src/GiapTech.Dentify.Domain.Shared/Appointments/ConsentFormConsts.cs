namespace GiapTech.Dentify.Appointments;

public static class ConsentFormConsts
{
    public const int MaxFileNameLength = 256;
    public const int MaxContentTypeLength = 128;
    public const int MaxFormTitleLength = 256;
    public const long MaxSizeBytes = 10 * 1024 * 1024;

    public static readonly string[] AllowedContentTypes =
    {
        "application/pdf",
        "image/jpeg",
        "image/png"
    };

    public const string BlobContainerName = "dentify-consent-forms";
}
