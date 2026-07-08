using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Chairs;

public class Chair : FullAuditedAggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public bool IsActive { get; private set; }

    protected Chair()
    {
    }

    public Chair(Guid id, string name)
        : base(id)
    {
        SetName(name);
        IsActive = true;
    }

    public void SetName(string name)
    {
        Name = Check.Length(
            Check.NotNullOrWhiteSpace(name, nameof(name))!,
            nameof(name),
            ChairConsts.MaxNameLength)!;
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
