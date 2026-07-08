using System;
using System.Collections.Generic;
using System.Linq;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Appointments;

public class Appointment : FullAuditedAggregateRoot<Guid>
{
    public Guid PatientId { get; private set; }
    public Guid? DoctorId { get; private set; }
    public Guid? ServiceId { get; private set; }
    public Guid? ChairId { get; private set; }
    public DateTime ScheduledDateTime { get; private set; }
    public int DurationMinutes { get; private set; }
    public AppointmentStatus Status { get; private set; }
    public string? PreOpNotes { get; private set; }
    public string? PostOpNotes { get; private set; }
    public decimal Price { get; private set; }
    public decimal PaidAmount { get; private set; }
    public PaymentStatus PaymentStatus { get; private set; }
    public DateTime? ReminderSentAt { get; private set; }

    private readonly List<PrescriptionItem> _prescriptionItems = new();
    public IReadOnlyList<PrescriptionItem> PrescriptionItems => _prescriptionItems;

    private readonly List<Payment> _payments = new();
    public IReadOnlyList<Payment> Payments => _payments;

    protected Appointment()
    {
    }

    public Appointment(Guid id, Guid patientId, DateTime scheduledDateTime, decimal price, Guid? doctorId = null, Guid? serviceId = null, int durationMinutes = AppointmentConsts.DefaultDurationMinutes, Guid? chairId = null)
        : base(id)
    {
        PatientId = patientId;
        Reschedule(scheduledDateTime);
        DoctorId = doctorId;
        Status = AppointmentStatus.Scheduled;
        ServiceId = serviceId;
        ChairId = chairId;
        PaymentStatus = PaymentStatus.Unpaid;
        SetPrice(price);
        SetDuration(durationMinutes);
    }

    public void Reschedule(DateTime scheduledDateTime)
    {
        // PostgreSQL's "timestamp with time zone" only accepts UTC DateTimes.
        ScheduledDateTime = DateTime.SpecifyKind(scheduledDateTime, DateTimeKind.Utc);
    }

    public void SetDuration(int durationMinutes)
    {
        Check.Range(durationMinutes, nameof(durationMinutes), AppointmentConsts.MinDurationMinutes, AppointmentConsts.MaxDurationMinutes);
        DurationMinutes = durationMinutes;
    }

    public void AssignPatient(Guid patientId)
    {
        PatientId = patientId;
    }

    public void AssignDoctor(Guid? doctorId)
    {
        DoctorId = doctorId;
    }

    public void ChangeStatus(AppointmentStatus status)
    {
        Status = status;
    }

    public void AssignService(Guid? serviceId)
    {
        ServiceId = serviceId;
    }

    public void AssignChair(Guid? chairId)
    {
        ChairId = chairId;
    }

    public void SetClinicalNotes(string? preOpNotes, string? postOpNotes)
    {
        PreOpNotes = Check.Length(preOpNotes, nameof(preOpNotes), AppointmentConsts.MaxNotesLength);
        PostOpNotes = Check.Length(postOpNotes, nameof(postOpNotes), AppointmentConsts.MaxNotesLength);
    }

    public PrescriptionItem AddPrescriptionItem(Guid id, string drugName, string? dosage, int quantity, string? instructions, Guid? drugId = null)
    {
        var item = new PrescriptionItem(id, Id, drugName, dosage, quantity, instructions, drugId);
        _prescriptionItems.Add(item);
        return item;
    }

    public void UpdatePrescriptionItem(Guid itemId, string drugName, string? dosage, int quantity, string? instructions, Guid? drugId = null)
    {
        var item = GetPrescriptionItem(itemId);
        item.SetDrugName(drugName);
        item.SetDosage(dosage);
        item.SetQuantity(quantity);
        item.SetInstructions(instructions);
        item.SetDrugId(drugId);
    }

    public void RemovePrescriptionItem(Guid itemId)
    {
        var item = GetPrescriptionItem(itemId);
        _prescriptionItems.Remove(item);
    }

    private PrescriptionItem GetPrescriptionItem(Guid itemId)
    {
        return _prescriptionItems.SingleOrDefault(x => x.Id == itemId)
            ?? throw new BusinessException(DentifyDomainErrorCodes.PrescriptionItemNotFound);
    }

    public void SetPrice(decimal price)
    {
        Check.Range(price, nameof(price), 0, decimal.MaxValue);

        if (price < PaidAmount)
        {
            throw new BusinessException(DentifyDomainErrorCodes.PaidAmountCannotExceedPrice);
        }

        Price = price;
        RecalculatePaymentStatus();
    }

    public Payment AddPayment(Guid id, decimal amount, DateTime paymentDate, PaymentMethod method, string? notes)
    {
        if (PaidAmount + amount > Price)
        {
            throw new BusinessException(DentifyDomainErrorCodes.PaidAmountCannotExceedPrice);
        }

        var payment = new Payment(id, Id, amount, paymentDate, method, notes);
        _payments.Add(payment);
        RecalculatePaymentStatus();
        return payment;
    }

    public void RemovePayment(Guid paymentId)
    {
        var payment = _payments.SingleOrDefault(x => x.Id == paymentId)
            ?? throw new BusinessException(DentifyDomainErrorCodes.PaymentNotFound);

        _payments.Remove(payment);
        RecalculatePaymentStatus();
    }

    public void MarkReminderSent(DateTime sentAt)
    {
        // PostgreSQL's "timestamp with time zone" only accepts UTC DateTimes.
        ReminderSentAt = DateTime.SpecifyKind(sentAt, DateTimeKind.Utc);
    }

    private void RecalculatePaymentStatus()
    {
        PaidAmount = _payments.Sum(x => x.Amount);

        if (PaidAmount <= 0)
        {
            PaymentStatus = PaymentStatus.Unpaid;
        }
        else if (PaidAmount < Price)
        {
            PaymentStatus = PaymentStatus.PartiallyPaid;
        }
        else
        {
            PaymentStatus = PaymentStatus.Paid;
        }
    }
}
