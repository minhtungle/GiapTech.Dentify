using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.TreatmentPlans;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Permissions;
using GiapTech.Dentify.TreatmentPlans;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using ServiceEntity = GiapTech.Dentify.Services.Service;

namespace GiapTech.Dentify.Application.TreatmentPlans;

[Authorize(DentifyPermissions.TreatmentPlans.Default)]
public class TreatmentPlanAppService : ApplicationService, ITreatmentPlanAppService
{
    private readonly ITreatmentPlanRepository _treatmentPlanRepository;
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly IRepository<ServiceEntity, Guid> _serviceRepository;
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly TreatmentPlanMapper _treatmentPlanMapper;

    public TreatmentPlanAppService(
        ITreatmentPlanRepository treatmentPlanRepository,
        IRepository<Patient, Guid> patientRepository,
        IRepository<ServiceEntity, Guid> serviceRepository,
        IRepository<Appointment, Guid> appointmentRepository,
        TreatmentPlanMapper treatmentPlanMapper)
    {
        _treatmentPlanRepository = treatmentPlanRepository;
        _patientRepository = patientRepository;
        _serviceRepository = serviceRepository;
        _appointmentRepository = appointmentRepository;
        _treatmentPlanMapper = treatmentPlanMapper;
    }

    public virtual async Task<TreatmentPlanDto> GetAsync(Guid id)
    {
        var plan = await _treatmentPlanRepository.GetWithDetailsAsync(id);
        return (await MapToDtosAsync(new List<TreatmentPlan> { plan })).Single();
    }

    public virtual async Task<PagedResultDto<TreatmentPlanDto>> GetListAsync(GetTreatmentPlanListDto input)
    {
        var queryable = await _treatmentPlanRepository.GetQueryableAsync();

        if (input.PatientId.HasValue)
        {
            queryable = queryable.Where(x => x.PatientId == input.PatientId.Value);
        }

        if (input.Status.HasValue)
        {
            queryable = queryable.Where(x => x.Status == input.Status.Value);
        }

        var totalCount = await AsyncExecuter.CountAsync(queryable);

        queryable = queryable.OrderByDescending(x => x.CreationTime);

        var ids = await AsyncExecuter.ToListAsync(
            queryable.Skip(input.SkipCount).Take(input.MaxResultCount).Select(x => x.Id));

        var plansById = (await _treatmentPlanRepository.GetListWithDetailsAsync(ids))
            .ToDictionary(x => x.Id);
        // Where(Contains) không đảm bảo thứ tự trả về khớp ids (đã OrderByDescending theo
        // CreationTime ở trên) — sắp lại đúng thứ tự đó.
        var plans = ids.Select(id => plansById[id]).ToList();

        return new PagedResultDto<TreatmentPlanDto>(totalCount, await MapToDtosAsync(plans));
    }

    [Authorize(DentifyPermissions.TreatmentPlans.Create)]
    public virtual async Task<TreatmentPlanDto> CreateAsync(CreateUpdateTreatmentPlanDto input)
    {
        await _patientRepository.GetAsync(input.PatientId);

        var plan = new TreatmentPlan(GuidGenerator.Create(), input.PatientId, input.Title, input.Notes);
        ApplyItems(plan, input.Items);

        await _treatmentPlanRepository.InsertAsync(plan);

        return (await MapToDtosAsync(new List<TreatmentPlan> { plan })).Single();
    }

    [Authorize(DentifyPermissions.TreatmentPlans.Update)]
    public virtual async Task<TreatmentPlanDto> UpdateAsync(Guid id, CreateUpdateTreatmentPlanDto input)
    {
        var plan = await _treatmentPlanRepository.GetWithDetailsAsync(id);

        await _patientRepository.GetAsync(input.PatientId);

        plan.SetTitle(input.Title);
        plan.SetNotes(input.Notes);
        ApplyItems(plan, input.Items);

        await _treatmentPlanRepository.UpdateAsync(plan);

        return (await MapToDtosAsync(new List<TreatmentPlan> { plan })).Single();
    }

    [Authorize(DentifyPermissions.TreatmentPlans.Update)]
    public virtual async Task<TreatmentPlanDto> ChangeStatusAsync(Guid id, ChangeTreatmentPlanStatusDto input)
    {
        var plan = await _treatmentPlanRepository.GetWithDetailsAsync(id);

        plan.ChangeStatus(input.Status);

        await _treatmentPlanRepository.UpdateAsync(plan);

        return (await MapToDtosAsync(new List<TreatmentPlan> { plan })).Single();
    }

    [Authorize(DentifyPermissions.TreatmentPlans.Update)]
    public virtual async Task<TreatmentPlanDto> ChangeItemStatusAsync(Guid id, Guid itemId, ChangeTreatmentPlanItemStatusDto input)
    {
        var plan = await _treatmentPlanRepository.GetWithDetailsAsync(id);

        plan.ChangeItemStatus(itemId, input.Status);

        await _treatmentPlanRepository.UpdateAsync(plan);

        return (await MapToDtosAsync(new List<TreatmentPlan> { plan })).Single();
    }

    [Authorize(DentifyPermissions.TreatmentPlans.Update)]
    public virtual async Task<TreatmentPlanDto> LinkItemToAppointmentAsync(Guid id, Guid itemId, LinkTreatmentPlanItemToAppointmentDto input)
    {
        var plan = await _treatmentPlanRepository.GetWithDetailsAsync(id);

        if (input.AppointmentId.HasValue)
        {
            var appointment = await _appointmentRepository.GetAsync(input.AppointmentId.Value);
            if (appointment.PatientId != plan.PatientId)
            {
                throw new BusinessException(DentifyDomainErrorCodes.AppointmentBelongsToDifferentPatient);
            }
        }

        plan.LinkItemToAppointment(itemId, input.AppointmentId);

        await _treatmentPlanRepository.UpdateAsync(plan);

        return (await MapToDtosAsync(new List<TreatmentPlan> { plan })).Single();
    }

    [Authorize(DentifyPermissions.TreatmentPlans.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _treatmentPlanRepository.DeleteAsync(id);
    }

    private void ApplyItems(TreatmentPlan plan, List<CreateUpdateTreatmentPlanItemDto> items)
    {
        var incomingIds = items.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();

        foreach (var existing in plan.Items.ToList())
        {
            if (!incomingIds.Contains(existing.Id))
            {
                plan.RemoveItem(existing.Id);
            }
        }

        foreach (var item in items)
        {
            if (item.Id.HasValue)
            {
                plan.UpdateItem(item.Id.Value, item.StepOrder, item.Description, item.EstimatedCost, item.ServiceId);
            }
            else
            {
                plan.AddItem(GuidGenerator.Create(), item.StepOrder, item.Description, item.EstimatedCost, item.ServiceId);
            }
        }
    }

    private async Task<List<TreatmentPlanDto>> MapToDtosAsync(List<TreatmentPlan> plans)
    {
        var patientIds = plans.Select(x => x.PatientId).Distinct().ToList();
        var patientQueryable = await _patientRepository.GetQueryableAsync();
        var patientNames = await AsyncExecuter.ToListAsync(
            patientQueryable.Where(p => patientIds.Contains(p.Id)).Select(p => new { p.Id, p.FullName }));
        var patientNameMap = patientNames.ToDictionary(p => p.Id, p => p.FullName);

        var serviceIds = plans.SelectMany(p => p.Items)
            .Where(i => i.ServiceId.HasValue)
            .Select(i => i.ServiceId!.Value)
            .Distinct()
            .ToList();
        var serviceQueryable = await _serviceRepository.GetQueryableAsync();
        var services = await AsyncExecuter.ToListAsync(
            serviceQueryable.Where(s => serviceIds.Contains(s.Id)).Select(s => new { s.Id, s.Name }));
        var serviceNameMap = services.ToDictionary(s => s.Id, s => s.Name);

        return plans.Select(plan =>
        {
            var dto = _treatmentPlanMapper.MapToDto(plan);
            dto.PatientFullName = patientNameMap.TryGetValue(plan.PatientId, out var patientName) ? patientName : string.Empty;
            dto.Items = plan.Items.Select(item =>
            {
                var itemDto = _treatmentPlanMapper.MapToDto(item);
                itemDto.ServiceName = item.ServiceId.HasValue
                    && serviceNameMap.TryGetValue(item.ServiceId.Value, out var serviceName)
                        ? serviceName
                        : null;
                return itemDto;
            }).OrderBy(i => i.StepOrder).ToList();
            return dto;
        }).ToList();
    }
}
