using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.TreatmentPlans;

namespace GiapTech.Dentify.Application.Contracts.TreatmentPlans;

public class CreateUpdateTreatmentPlanDto
{
    [Required]
    public Guid PatientId { get; set; }

    [Required]
    [StringLength(TreatmentPlanConsts.MaxTitleLength)]
    public string Title { get; set; } = string.Empty;

    [StringLength(TreatmentPlanConsts.MaxNotesLength)]
    public string? Notes { get; set; }

    public List<CreateUpdateTreatmentPlanItemDto> Items { get; set; } = new();
}
