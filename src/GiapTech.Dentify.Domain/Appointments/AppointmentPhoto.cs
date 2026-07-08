using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Appointments;

public class AppointmentPhoto : CreationAuditedAggregateRoot<Guid>
{
    public Guid AppointmentId { get; private set; }
    public string BlobName { get; private set; }
    public string FileName { get; private set; }
    public string ContentType { get; private set; }
    public long SizeBytes { get; private set; }
    public string? Caption { get; private set; }

    protected AppointmentPhoto()
    {
        BlobName = string.Empty;
        FileName = string.Empty;
        ContentType = string.Empty;
    }

    public AppointmentPhoto(
        Guid id,
        Guid appointmentId,
        string blobName,
        string fileName,
        string contentType,
        long sizeBytes,
        string? caption = null)
        : base(id)
    {
        AppointmentId = appointmentId;
        BlobName = Check.NotNullOrWhiteSpace(blobName, nameof(blobName))!;
        FileName = Check.Length(
            Check.NotNullOrWhiteSpace(fileName, nameof(fileName))!,
            nameof(fileName),
            AppointmentPhotoConsts.MaxFileNameLength)!;
        ContentType = Check.Length(
            Check.NotNullOrWhiteSpace(contentType, nameof(contentType))!,
            nameof(contentType),
            AppointmentPhotoConsts.MaxContentTypeLength)!;
        SizeBytes = sizeBytes;
        Caption = Check.Length(caption, nameof(caption), AppointmentPhotoConsts.MaxCaptionLength);
    }

    public void SetCaption(string? caption)
    {
        Caption = Check.Length(caption, nameof(caption), AppointmentPhotoConsts.MaxCaptionLength);
    }
}
