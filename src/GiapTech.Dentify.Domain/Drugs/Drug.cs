using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Drugs;

public class Drug : FullAuditedAggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public string? DefaultDosage { get; private set; }
    public bool IsActive { get; private set; }

    protected Drug()
    {
    }

    public Drug(Guid id, string name, string? defaultDosage = null)
        : base(id)
    {
        SetName(name);
        SetDefaultDosage(defaultDosage);
        IsActive = true;
    }

    public void SetName(string name)
    {
        Name = Check.Length(
            Check.NotNullOrWhiteSpace(name, nameof(name))!,
            nameof(name),
            DrugConsts.MaxNameLength)!;
    }

    public void SetDefaultDosage(string? defaultDosage)
    {
        DefaultDosage = Check.Length(defaultDosage, nameof(defaultDosage), DrugConsts.MaxDefaultDosageLength);
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
