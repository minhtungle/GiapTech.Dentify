using System;
using GiapTech.Dentify.TreatmentPlans;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.TreatmentPlans;

public class GetTreatmentPlanListDto : PagedAndSortedResultRequestDto
{
    public Guid? PatientId { get; set; }
    public TreatmentPlanStatus? Status { get; set; }
}
