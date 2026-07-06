using System;
using System.Collections.Generic;
using System.Linq;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.ToothCharts;

public class ToothChart : FullAuditedAggregateRoot<Guid>
{
    public Guid PatientId { get; private set; }

    private readonly List<ToothRecord> _records = new();
    public IReadOnlyList<ToothRecord> Records => _records;

    protected ToothChart()
    {
    }

    public ToothChart(Guid id, Guid patientId, IEnumerable<int> initialToothNumbers)
        : base(id)
    {
        PatientId = patientId;

        foreach (var toothNumber in initialToothNumbers.Distinct())
        {
            _records.Add(new ToothRecord(Guid.NewGuid(), id, toothNumber));
        }
    }

    public ToothRecord GetRecord(int toothNumber)
    {
        var record = _records.FirstOrDefault(r => r.ToothNumber == toothNumber);
        if (record == null)
        {
            throw new BusinessException(DentifyDomainErrorCodes.ToothRecordNotFound)
                .WithData("ToothNumber", toothNumber);
        }

        return record;
    }

    public ToothRecord UpdateToothStatus(
        int toothNumber,
        ToothStatus status,
        string? notes,
        Guid? appointmentId,
        DateTime updatedAt)
    {
        if (!ToothNumbers.IsValid(toothNumber))
        {
            throw new BusinessException(DentifyDomainErrorCodes.InvalidToothNumber)
                .WithData("ToothNumber", toothNumber);
        }

        var record = _records.FirstOrDefault(r => r.ToothNumber == toothNumber);
        if (record == null)
        {
            record = new ToothRecord(Guid.NewGuid(), Id, toothNumber);
            _records.Add(record);
        }

        record.UpdateStatus(status, notes, appointmentId, updatedAt);

        return record;
    }
}
