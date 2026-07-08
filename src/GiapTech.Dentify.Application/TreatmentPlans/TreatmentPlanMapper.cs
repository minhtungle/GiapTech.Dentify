using GiapTech.Dentify.Application.Contracts.TreatmentPlans;
using GiapTech.Dentify.TreatmentPlans;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.TreatmentPlans;

[Mapper]
public partial class TreatmentPlanMapper
{
    [MapperIgnoreTarget(nameof(TreatmentPlanDto.PatientFullName))]
    [MapperIgnoreSource(nameof(TreatmentPlan.ExtraProperties))]
    [MapperIgnoreSource(nameof(TreatmentPlan.ConcurrencyStamp))]
    public partial TreatmentPlanDto MapToDto(TreatmentPlan treatmentPlan);

    [MapperIgnoreTarget(nameof(TreatmentPlanItemDto.ServiceName))]
    public partial TreatmentPlanItemDto MapToDto(TreatmentPlanItem item);
}
