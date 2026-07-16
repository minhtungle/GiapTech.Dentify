using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Supplies;

public class SupplyUsage : CreationAuditedAggregateRoot<Guid>
{
    public Guid SupplyId { get; private set; }
    public decimal Quantity { get; private set; }
    public Guid? AppointmentId { get; private set; }
    public DateTime UsedAt { get; private set; }
    public string? Notes { get; private set; }

    protected SupplyUsage()
    {
    }

    public SupplyUsage(Guid id, Guid supplyId, decimal quantity, DateTime usedAt, Guid? appointmentId = null, string? notes = null)
        : base(id)
    {
        SupplyId = supplyId;

        if (quantity <= 0)
        {
            throw new AbpException($"{nameof(quantity)} must be greater than 0.");
        }
        Quantity = quantity;

        AppointmentId = appointmentId;
        // PostgreSQL's "timestamp with time zone" only accepts UTC DateTimes.
        UsedAt = DateTime.SpecifyKind(usedAt, DateTimeKind.Utc);
        Notes = Check.Length(notes, nameof(notes), SupplyUsageConsts.MaxNotesLength);
    }
}
