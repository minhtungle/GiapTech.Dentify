using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.MedicalTerms;

public class MedicalTerm : FullAuditedAggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public MedicalTermCategory Category { get; private set; }
    public bool IsActive { get; private set; }

    protected MedicalTerm()
    {
    }

    public MedicalTerm(Guid id, string name, MedicalTermCategory category)
        : base(id)
    {
        SetName(name);
        Category = category;
        IsActive = true;
    }

    public void SetName(string name)
    {
        Name = Check.Length(
            Check.NotNullOrWhiteSpace(name, nameof(name))!,
            nameof(name),
            MedicalTermConsts.MaxNameLength)!;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}
