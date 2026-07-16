using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Appointments;

public class ConsentForm : CreationAuditedAggregateRoot<Guid>
{
    public Guid AppointmentId { get; private set; }
    public string BlobName { get; private set; }
    public string FileName { get; private set; }
    public string ContentType { get; private set; }
    public long SizeBytes { get; private set; }
    public string FormTitle { get; private set; }
    public DateTime SignedAt { get; private set; }

    protected ConsentForm()
    {
        BlobName = string.Empty;
        FileName = string.Empty;
        ContentType = string.Empty;
        FormTitle = string.Empty;
    }

    public ConsentForm(
        Guid id,
        Guid appointmentId,
        string blobName,
        string fileName,
        string contentType,
        long sizeBytes,
        string formTitle,
        DateTime signedAt)
        : base(id)
    {
        AppointmentId = appointmentId;
        BlobName = Check.NotNullOrWhiteSpace(blobName, nameof(blobName))!;
        FileName = Check.Length(
            Check.NotNullOrWhiteSpace(fileName, nameof(fileName))!,
            nameof(fileName),
            ConsentFormConsts.MaxFileNameLength)!;
        ContentType = Check.Length(
            Check.NotNullOrWhiteSpace(contentType, nameof(contentType))!,
            nameof(contentType),
            ConsentFormConsts.MaxContentTypeLength)!;
        SizeBytes = sizeBytes;
        FormTitle = Check.Length(
            Check.NotNullOrWhiteSpace(formTitle, nameof(formTitle))!,
            nameof(formTitle),
            ConsentFormConsts.MaxFormTitleLength)!;
        // PostgreSQL's "timestamp with time zone" only accepts UTC DateTimes.
        SignedAt = DateTime.SpecifyKind(signedAt, DateTimeKind.Utc);
    }
}
