using System;
using System.Collections.Generic;
using GiapTech.Dentify.ToothCharts;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.LabWorks;

public class LabWork : FullAuditedAggregateRoot<Guid>
{
    public Guid PatientId { get; private set; }
    public Guid? AppointmentId { get; private set; }
    public string LabName { get; private set; } = null!;
    public string WorkType { get; private set; } = null!;
    public List<int> ToothNumberList { get; private set; }
    public DateTime SentDate { get; private set; }
    public DateTime? ExpectedReceiveDate { get; private set; }
    public DateTime? ReceivedDate { get; private set; }
    public decimal Cost { get; private set; }
    public LabWorkStatus Status { get; private set; }
    public string? Notes { get; private set; }

    protected LabWork()
    {
        LabName = string.Empty;
        WorkType = string.Empty;
        ToothNumberList = new List<int>();
    }

    public LabWork(
        Guid id,
        Guid patientId,
        string labName,
        string workType,
        DateTime sentDate,
        Guid? appointmentId = null)
        : base(id)
    {
        PatientId = patientId;
        AppointmentId = appointmentId;
        SetLabName(labName);
        SetWorkType(workType);
        ToothNumberList = new List<int>();
        SetSentDate(sentDate);
        Status = LabWorkStatus.Sent;
    }

    public void SetLabName(string labName)
    {
        LabName = Check.Length(
            Check.NotNullOrWhiteSpace(labName, nameof(labName))!,
            nameof(labName),
            LabWorkConsts.MaxLabNameLength)!;
    }

    public void SetWorkType(string workType)
    {
        WorkType = Check.Length(
            Check.NotNullOrWhiteSpace(workType, nameof(workType))!,
            nameof(workType),
            LabWorkConsts.MaxWorkTypeLength)!;
    }

    public void SetToothNumbers(IEnumerable<int> toothNumbers)
    {
        var numbers = new List<int>(toothNumbers);
        foreach (var number in numbers)
        {
            if (!ToothCharts.ToothNumbers.IsValid(number))
            {
                throw new BusinessException(DentifyDomainErrorCodes.InvalidToothNumber);
            }
        }

        ToothNumberList = numbers;
    }

    public void AssignAppointment(Guid? appointmentId)
    {
        AppointmentId = appointmentId;
    }

    public void SetSentDate(DateTime sentDate)
    {
        SentDate = DateTime.SpecifyKind(sentDate, DateTimeKind.Utc);
    }

    public void SetExpectedReceiveDate(DateTime? expectedReceiveDate)
    {
        ExpectedReceiveDate = expectedReceiveDate.HasValue
            ? DateTime.SpecifyKind(expectedReceiveDate.Value, DateTimeKind.Utc)
            : null;
    }

    public void SetCost(decimal cost)
    {
        Check.Range(cost, nameof(cost), 0, decimal.MaxValue);
        Cost = cost;
    }

    public void SetNotes(string? notes)
    {
        Notes = Check.Length(notes, nameof(notes), LabWorkConsts.MaxNotesLength);
    }

    public void ChangeStatus(LabWorkStatus status)
    {
        if (status == LabWorkStatus.Received && !ReceivedDate.HasValue)
        {
            ReceivedDate = DateTime.UtcNow;
        }

        Status = status;
    }
}
