using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Services;

public class Service : FullAuditedAggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public decimal Price { get; private set; }
    public bool IsActive { get; private set; }

    protected Service()
    {
    }

    public Service(Guid id, string name, decimal price)
        : base(id)
    {
        SetName(name);
        SetPrice(price);
        IsActive = true;
    }

    public void SetName(string name)
    {
        Name = Check.Length(
            Check.NotNullOrWhiteSpace(name, nameof(name))!,
            nameof(name),
            ServiceConsts.MaxNameLength)!;
    }

    public void SetPrice(decimal price)
    {
        Check.Range(price, nameof(price), 0, decimal.MaxValue);
        Price = price;
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
