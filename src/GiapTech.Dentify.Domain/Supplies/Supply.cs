using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Supplies;

public class Supply : FullAuditedAggregateRoot<Guid>
{
    public string Name { get; private set; } = null!;
    public string Unit { get; private set; } = null!;
    public decimal Quantity { get; private set; }
    public decimal? LowStockThreshold { get; private set; }
    public bool IsActive { get; private set; }

    protected Supply()
    {
    }

    public Supply(Guid id, string name, string unit, decimal? lowStockThreshold = null)
        : base(id)
    {
        SetName(name);
        SetUnit(unit);
        SetLowStockThreshold(lowStockThreshold);
        Quantity = 0;
        IsActive = true;
    }

    public void SetName(string name)
    {
        Name = Check.Length(
            Check.NotNullOrWhiteSpace(name, nameof(name))!,
            nameof(name),
            SupplyConsts.MaxNameLength)!;
    }

    public void SetUnit(string unit)
    {
        Unit = Check.Length(
            Check.NotNullOrWhiteSpace(unit, nameof(unit))!,
            nameof(unit),
            SupplyConsts.MaxUnitLength)!;
    }

    public void SetLowStockThreshold(decimal? lowStockThreshold)
    {
        if (lowStockThreshold.HasValue)
        {
            Check.Range(lowStockThreshold.Value, nameof(lowStockThreshold), 0, decimal.MaxValue);
        }

        LowStockThreshold = lowStockThreshold;
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void IncreaseQuantity(decimal amount)
    {
        if (amount <= 0)
        {
            throw new AbpException($"{nameof(amount)} must be greater than 0.");
        }

        Quantity += amount;
    }

    public void DecreaseQuantity(decimal amount)
    {
        if (amount <= 0)
        {
            throw new AbpException($"{nameof(amount)} must be greater than 0.");
        }

        if (amount > Quantity)
        {
            throw new BusinessException(DentifyDomainErrorCodes.InsufficientSupplyQuantity);
        }

        Quantity -= amount;
    }
}
