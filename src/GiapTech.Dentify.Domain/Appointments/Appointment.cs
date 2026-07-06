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
    public DateTime ScheduledDateTime { get; private set; }
    public AppointmentStatus Status { get; private set; }
    public string? PreOpNotes { get; private set; }
    public string? PostOpNotes { get; private set; }
    public decimal Price { get; private set; }
    public decimal PaidAmount { get; private set; }
    public PaymentStatus PaymentStatus { get; private set; }

    private readonly List<PrescriptionItem> _prescriptionItems = new();
    public IReadOnlyList<PrescriptionItem> PrescriptionItems => _prescriptionItems;

    protected Appointment()
    {
    }

    public Appointment(Guid id, Guid patientId, DateTime scheduledDateTime, decimal price, Guid? doctorId = null)
        : base(id)
    {
        PatientId = patientId;
        Reschedule(scheduledDateTime);
        DoctorId = doctorId;
        Status = AppointmentStatus.Scheduled;
        PaymentStatus = PaymentStatus.Unpaid;
        SetPrice(price);
    }

    public void Reschedule(DateTime scheduledDateTime)
    {
        // PostgreSQL's "timestamp with time zone" only accepts UTC DateTimes.
        ScheduledDateTime = DateTime.SpecifyKind(scheduledDateTime, DateTimeKind.Utc);
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

    public void SetClinicalNotes(string? preOpNotes, string? postOpNotes)
    {
        PreOpNotes = Check.Length(preOpNotes, nameof(preOpNotes), AppointmentConsts.MaxNotesLength);
        PostOpNotes = Check.Length(postOpNotes, nameof(postOpNotes), AppointmentConsts.MaxNotesLength);
    }

    public PrescriptionItem AddPrescriptionItem(Guid id, string drugName, string? dosage, int quantity, string? instructions)
    {
        var item = new PrescriptionItem(id, Id, drugName, dosage, quantity, instructions);
        _prescriptionItems.Add(item);
        return item;
    }

    public void UpdatePrescriptionItem(Guid itemId, string drugName, string? dosage, int quantity, string? instructions)
    {
        var item = GetPrescriptionItem(itemId);
        item.SetDrugName(drugName);
        item.SetDosage(dosage);
        item.SetQuantity(quantity);
        item.SetInstructions(instructions);
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

    public void RecordPayment(decimal paidAmount)
    {
        Check.Range(paidAmount, nameof(paidAmount), 0, decimal.MaxValue);

        if (paidAmount > Price)
        {
            throw new BusinessException(DentifyDomainErrorCodes.PaidAmountCannotExceedPrice);
        }

        PaidAmount = paidAmount;
        RecalculatePaymentStatus();
    }

    private void RecalculatePaymentStatus()
    {
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
