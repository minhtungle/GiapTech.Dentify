using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace GiapTech.Dentify.TreatmentPlans;

public class TreatmentPlanItem : Entity<Guid>
{
    public Guid TreatmentPlanId { get; private set; }
    public Guid? ServiceId { get; private set; }
    public int StepOrder { get; private set; }
    public string Description { get; private set; } = null!;
    public decimal EstimatedCost { get; private set; }
    public TreatmentPlanItemStatus Status { get; private set; }
    public Guid? AppointmentId { get; private set; }

    protected TreatmentPlanItem()
    {
        Description = string.Empty;
    }

    internal TreatmentPlanItem(
        Guid id,
        Guid treatmentPlanId,
        int stepOrder,
        string description,
        decimal estimatedCost,
        Guid? serviceId = null)
        : base(id)
    {
        TreatmentPlanId = treatmentPlanId;
        StepOrder = stepOrder;
        ServiceId = serviceId;
        SetDescription(description);
        SetEstimatedCost(estimatedCost);
        Status = TreatmentPlanItemStatus.Pending;
    }

    internal void SetDescription(string description)
    {
        Description = Check.Length(
            Check.NotNullOrWhiteSpace(description, nameof(description))!,
            nameof(description),
            TreatmentPlanConsts.MaxItemDescriptionLength)!;
    }

    internal void SetEstimatedCost(decimal estimatedCost)
    {
        Check.Range(estimatedCost, nameof(estimatedCost), 0, decimal.MaxValue);
        EstimatedCost = estimatedCost;
    }

    internal void SetServiceId(Guid? serviceId)
    {
        ServiceId = serviceId;
    }

    internal void SetStepOrder(int stepOrder)
    {
        StepOrder = stepOrder;
    }

    internal void ChangeStatus(TreatmentPlanItemStatus status)
    {
        Status = status;
    }

    internal void LinkToAppointment(Guid? appointmentId)
    {
        AppointmentId = appointmentId;
    }
}
