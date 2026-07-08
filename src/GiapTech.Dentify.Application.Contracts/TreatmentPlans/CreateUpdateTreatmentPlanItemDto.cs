using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.TreatmentPlans;

namespace GiapTech.Dentify.Application.Contracts.TreatmentPlans;

public class CreateUpdateTreatmentPlanItemDto
{
    public Guid? Id { get; set; }

    public Guid? ServiceId { get; set; }

    public int StepOrder { get; set; }

    [Required]
    [StringLength(TreatmentPlanConsts.MaxItemDescriptionLength)]
    public string Description { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal EstimatedCost { get; set; }
}
