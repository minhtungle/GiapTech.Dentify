using System;
using System.Collections.Generic;
using GiapTech.Dentify.TreatmentPlans;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.TreatmentPlans;

public class TreatmentPlanDto : FullAuditedEntityDto<Guid>
{
    public Guid PatientId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public TreatmentPlanStatus Status { get; set; }
    public List<TreatmentPlanItemDto> Items { get; set; } = new();
}
