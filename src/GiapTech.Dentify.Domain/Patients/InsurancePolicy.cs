using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Patients;

public class InsurancePolicy : FullAuditedAggregateRoot<Guid>
{
    public Guid PatientId { get; private set; }
    public string ProviderName { get; private set; } = null!;
    public string PolicyNumber { get; private set; } = null!;
    public DateTime EffectiveDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public string? Notes { get; private set; }

    protected InsurancePolicy()
    {
    }

    public InsurancePolicy(
        Guid id,
        Guid patientId,
        string providerName,
        string policyNumber,
        DateTime effectiveDate,
        DateTime? expiryDate = null,
        string? notes = null)
        : base(id)
    {
        PatientId = patientId;
        SetProviderName(providerName);
        SetPolicyNumber(policyNumber);
        SetDates(effectiveDate, expiryDate);
        SetNotes(notes);
    }

    public void SetProviderName(string providerName)
    {
        ProviderName = Check.Length(
            Check.NotNullOrWhiteSpace(providerName, nameof(providerName))!,
            nameof(providerName),
            InsurancePolicyConsts.MaxProviderNameLength)!;
    }

    public void SetPolicyNumber(string policyNumber)
    {
        PolicyNumber = Check.Length(
            Check.NotNullOrWhiteSpace(policyNumber, nameof(policyNumber))!,
            nameof(policyNumber),
            InsurancePolicyConsts.MaxPolicyNumberLength)!;
    }

    public void SetDates(DateTime effectiveDate, DateTime? expiryDate)
    {
        // PostgreSQL's "timestamp with time zone" only accepts UTC DateTimes.
        EffectiveDate = DateTime.SpecifyKind(effectiveDate, DateTimeKind.Utc);
        ExpiryDate = expiryDate.HasValue ? DateTime.SpecifyKind(expiryDate.Value, DateTimeKind.Utc) : null;
    }

    public void SetNotes(string? notes)
    {
        Notes = Check.Length(notes, nameof(notes), InsurancePolicyConsts.MaxNotesLength);
    }
}
