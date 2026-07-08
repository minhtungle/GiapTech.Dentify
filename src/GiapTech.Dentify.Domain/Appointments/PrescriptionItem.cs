using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace GiapTech.Dentify.Appointments;

public class PrescriptionItem : Entity<Guid>
{
    public Guid AppointmentId { get; private set; }
    public string DrugName { get; private set; } = null!;
    public Guid? DrugId { get; private set; }
    public string? Dosage { get; private set; }
    public int Quantity { get; private set; }
    public string? Instructions { get; private set; }

    protected PrescriptionItem()
    {
        DrugName = string.Empty;
    }

    internal PrescriptionItem(Guid id, Guid appointmentId, string drugName, string? dosage, int quantity, string? instructions, Guid? drugId = null)
        : base(id)
    {
        AppointmentId = appointmentId;
        SetDrugName(drugName);
        SetDosage(dosage);
        SetQuantity(quantity);
        SetInstructions(instructions);
        SetDrugId(drugId);
    }

    internal void SetDrugName(string drugName)
    {
        DrugName = Check.Length(
            Check.NotNullOrWhiteSpace(drugName, nameof(drugName))!,
            nameof(drugName),
            PrescriptionItemConsts.MaxDrugNameLength)!;
    }

    internal void SetDosage(string? dosage)
    {
        Dosage = Check.Length(dosage, nameof(dosage), PrescriptionItemConsts.MaxDosageLength);
    }

    internal void SetQuantity(int quantity)
    {
        Check.Range(quantity, nameof(quantity), 1, int.MaxValue);
        Quantity = quantity;
    }

    internal void SetInstructions(string? instructions)
    {
        Instructions = Check.Length(instructions, nameof(instructions), PrescriptionItemConsts.MaxInstructionsLength);
    }

    internal void SetDrugId(Guid? drugId)
    {
        DrugId = drugId;
    }
}
