using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace GiapTech.Dentify.ToothCharts;

public class ToothRecord : Entity<Guid>
{
    public Guid ToothChartId { get; private set; }
    public int ToothNumber { get; private set; }
    public ToothStatus Status { get; private set; }
    public string? Notes { get; private set; }
    public DateTime LastUpdated { get; private set; }
    public Guid? UpdatedByAppointmentId { get; private set; }

    protected ToothRecord()
    {
    }

    internal ToothRecord(Guid id, Guid toothChartId, int toothNumber)
        : base(id)
    {
        ToothChartId = toothChartId;
        ToothNumber = toothNumber;
        Status = ToothStatus.Healthy;
        LastUpdated = DateTime.UtcNow;
    }

    internal void UpdateStatus(ToothStatus status, string? notes, Guid? appointmentId, DateTime updatedAt)
    {
        Status = status;
        Notes = Check.Length(notes, nameof(notes), ToothChartConsts.MaxNotesLength);
        UpdatedByAppointmentId = appointmentId;
        // PostgreSQL's "timestamp with time zone" only accepts UTC DateTimes.
        LastUpdated = DateTime.SpecifyKind(updatedAt, DateTimeKind.Utc);
    }
}
