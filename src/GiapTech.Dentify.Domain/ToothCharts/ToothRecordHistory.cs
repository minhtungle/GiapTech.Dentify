using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.ToothCharts;

/// <summary>
/// Append-only log of every status change made to a tooth. Modeled as its own aggregate
/// root (rather than a child collection of <see cref="ToothChart"/>) since it grows
/// unbounded over the lifetime of a patient and is queried independently
/// (<c>GetToothHistoryAsync</c>) without needing to load the whole chart.
/// </summary>
public class ToothRecordHistory : CreationAuditedAggregateRoot<Guid>
{
    public Guid PatientId { get; private set; }
    public int ToothNumber { get; private set; }
    public ToothStatus Status { get; private set; }
    public string? Notes { get; private set; }
    public Guid? AppointmentId { get; private set; }
    public DateTime RecordedAt { get; private set; }

    protected ToothRecordHistory()
    {
    }

    public ToothRecordHistory(
        Guid id,
        Guid patientId,
        int toothNumber,
        ToothStatus status,
        string? notes,
        Guid? appointmentId,
        DateTime recordedAt)
        : base(id)
    {
        PatientId = patientId;
        ToothNumber = toothNumber;
        Status = status;
        Notes = Check.Length(notes, nameof(notes), ToothChartConsts.MaxNotesLength);
        AppointmentId = appointmentId;
        // PostgreSQL's "timestamp with time zone" only accepts UTC DateTimes.
        RecordedAt = DateTime.SpecifyKind(recordedAt, DateTimeKind.Utc);
    }
}
