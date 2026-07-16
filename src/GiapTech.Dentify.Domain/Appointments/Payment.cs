using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Appointments;

public class Payment : CreationAuditedEntity<Guid>
{
    public Guid AppointmentId { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime PaymentDate { get; private set; }
    public PaymentMethod Method { get; private set; }
    public string? Notes { get; private set; }

    protected Payment()
    {
    }

    internal Payment(Guid id, Guid appointmentId, decimal amount, DateTime paymentDate, PaymentMethod method, string? notes)
        : base(id)
    {
        AppointmentId = appointmentId;
        SetAmount(amount);
        SetPaymentDate(paymentDate);
        Method = method;
        SetNotes(notes);
    }

    internal void SetAmount(decimal amount)
    {
        Check.Range(amount, nameof(amount), 0.01m, decimal.MaxValue);
        Amount = amount;
    }

    internal void SetPaymentDate(DateTime paymentDate)
    {
        PaymentDate = DateTime.SpecifyKind(paymentDate, DateTimeKind.Utc);
    }

    internal void SetNotes(string? notes)
    {
        Notes = Check.Length(notes, nameof(notes), PaymentConsts.MaxNotesLength);
    }
}
