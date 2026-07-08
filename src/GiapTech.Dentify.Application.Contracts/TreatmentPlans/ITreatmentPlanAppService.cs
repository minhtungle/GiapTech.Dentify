using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.TreatmentPlans;

public interface ITreatmentPlanAppService : IApplicationService
{
    Task<TreatmentPlanDto> GetAsync(Guid id);

    Task<PagedResultDto<TreatmentPlanDto>> GetListAsync(GetTreatmentPlanListDto input);

    Task<TreatmentPlanDto> CreateAsync(CreateUpdateTreatmentPlanDto input);

    Task<TreatmentPlanDto> UpdateAsync(Guid id, CreateUpdateTreatmentPlanDto input);

    Task<TreatmentPlanDto> ChangeStatusAsync(Guid id, ChangeTreatmentPlanStatusDto input);

    Task<TreatmentPlanDto> ChangeItemStatusAsync(Guid id, Guid itemId, ChangeTreatmentPlanItemStatusDto input);

    Task<TreatmentPlanDto> LinkItemToAppointmentAsync(Guid id, Guid itemId, LinkTreatmentPlanItemToAppointmentDto input);

    Task DeleteAsync(Guid id);
}
