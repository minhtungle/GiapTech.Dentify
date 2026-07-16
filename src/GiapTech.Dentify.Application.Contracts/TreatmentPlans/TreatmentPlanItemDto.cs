using System;
using GiapTech.Dentify.TreatmentPlans;

namespace GiapTech.Dentify.Application.Contracts.TreatmentPlans;

public class TreatmentPlanItemDto
{
    public Guid Id { get; set; }
    public Guid TreatmentPlanId { get; set; }
    public Guid? ServiceId { get; set; }
    public string? ServiceName { get; set; }
    public int StepOrder { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal EstimatedCost { get; set; }
    public TreatmentPlanItemStatus Status { get; set; }
    public Guid? AppointmentId { get; set; }
}
