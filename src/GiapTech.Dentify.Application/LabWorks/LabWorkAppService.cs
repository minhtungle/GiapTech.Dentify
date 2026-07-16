using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Application.Contracts.LabWorks;
using GiapTech.Dentify.LabWorks;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.LabWorks;

[Authorize(DentifyPermissions.LabWorks.Default)]
public class LabWorkAppService : ApplicationService, ILabWorkAppService
{
    private readonly IRepository<LabWork, Guid> _labWorkRepository;
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly LabWorkMapper _labWorkMapper;

    public LabWorkAppService(
        IRepository<LabWork, Guid> labWorkRepository,
        IRepository<Patient, Guid> patientRepository,
        IRepository<Appointment, Guid> appointmentRepository,
        LabWorkMapper labWorkMapper)
    {
        _labWorkRepository = labWorkRepository;
        _patientRepository = patientRepository;
        _appointmentRepository = appointmentRepository;
        _labWorkMapper = labWorkMapper;
    }

    public virtual async Task<LabWorkDto> GetAsync(Guid id)
    {
        var labWork = await _labWorkRepository.GetAsync(id);
        return (await MapToDtosAsync(new List<LabWork> { labWork })).Single();
    }

    public virtual async Task<PagedResultDto<LabWorkDto>> GetListAsync(GetLabWorkListDto input)
    {
        var queryable = await _labWorkRepository.GetQueryableAsync();

        if (input.PatientId.HasValue)
        {
            queryable = queryable.Where(x => x.PatientId == input.PatientId.Value);
        }

        if (input.Status.HasValue)
        {
            queryable = queryable.Where(x => x.Status == input.Status.Value);
        }

        var totalCount = await AsyncExecuter.CountAsync(queryable);

        queryable = queryable.OrderByDescending(x => x.SentDate);

        var labWorks = await AsyncExecuter.ToListAsync(
            queryable.Skip(input.SkipCount).Take(input.MaxResultCount));

        return new PagedResultDto<LabWorkDto>(totalCount, await MapToDtosAsync(labWorks));
    }

    public virtual async Task<List<LabWorkDto>> GetBoardAsync()
    {
        var queryable = await _labWorkRepository.GetQueryableAsync();

        var labWorks = await AsyncExecuter.ToListAsync(
            queryable
                .Where(x => x.Status != LabWorkStatus.Cancelled)
                .OrderByDescending(x => x.SentDate));

        return await MapToDtosAsync(labWorks);
    }

    [Authorize(DentifyPermissions.LabWorks.Create)]
    public virtual async Task<LabWorkDto> CreateAsync(CreateUpdateLabWorkDto input)
    {
        await _patientRepository.GetAsync(input.PatientId);

        var labWork = new LabWork(
            GuidGenerator.Create(),
            input.PatientId,
            input.LabName,
            input.WorkType,
            input.SentDate,
            input.AppointmentId);

        ApplyInput(labWork, input);

        await _labWorkRepository.InsertAsync(labWork);

        return (await MapToDtosAsync(new List<LabWork> { labWork })).Single();
    }

    [Authorize(DentifyPermissions.LabWorks.Update)]
    public virtual async Task<LabWorkDto> UpdateAsync(Guid id, CreateUpdateLabWorkDto input)
    {
        var labWork = await _labWorkRepository.GetAsync(id);

        await _patientRepository.GetAsync(input.PatientId);

        labWork.AssignAppointment(input.AppointmentId);
        labWork.SetSentDate(input.SentDate);
        ApplyInput(labWork, input);

        await _labWorkRepository.UpdateAsync(labWork);

        return (await MapToDtosAsync(new List<LabWork> { labWork })).Single();
    }

    [Authorize(DentifyPermissions.LabWorks.Update)]
    public virtual async Task<LabWorkDto> UpdateStatusAsync(Guid id, UpdateLabWorkStatusDto input)
    {
        var labWork = await _labWorkRepository.GetAsync(id);

        labWork.ChangeStatus(input.Status);

        await _labWorkRepository.UpdateAsync(labWork);

        return (await MapToDtosAsync(new List<LabWork> { labWork })).Single();
    }

    [Authorize(DentifyPermissions.LabWorks.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _labWorkRepository.DeleteAsync(id);
    }

    private static void ApplyInput(LabWork labWork, CreateUpdateLabWorkDto input)
    {
        labWork.SetLabName(input.LabName);
        labWork.SetWorkType(input.WorkType);
        labWork.SetToothNumbers(input.ToothNumberList);
        labWork.SetExpectedReceiveDate(input.ExpectedReceiveDate);
        labWork.SetCost(input.Cost);
        labWork.SetNotes(input.Notes);
        labWork.ChangeStatus(input.Status);
    }

    private async Task<List<LabWorkDto>> MapToDtosAsync(List<LabWork> labWorks)
    {
        var patientIds = labWorks.Select(x => x.PatientId).Distinct().ToList();
        var patientQueryable = await _patientRepository.GetQueryableAsync();
        var patientNames = await AsyncExecuter.ToListAsync(
            patientQueryable
                .Where(p => patientIds.Contains(p.Id))
                .Select(p => new { p.Id, p.FullName }));
        var patientNameMap = patientNames.ToDictionary(p => p.Id, p => p.FullName);

        var appointmentIds = labWorks
            .Where(x => x.AppointmentId.HasValue)
            .Select(x => x.AppointmentId!.Value)
            .Distinct()
            .ToList();
        var appointmentQueryable = await _appointmentRepository.GetQueryableAsync();
        var appointmentTimes = await AsyncExecuter.ToListAsync(
            appointmentQueryable
                .Where(a => appointmentIds.Contains(a.Id))
                .Select(a => new { a.Id, a.ScheduledDateTime }));
        var appointmentTimeMap = appointmentTimes.ToDictionary(a => a.Id, a => a.ScheduledDateTime);

        return labWorks.Select(labWork =>
        {
            var dto = _labWorkMapper.MapToDto(labWork);
            dto.PatientFullName = patientNameMap.TryGetValue(labWork.PatientId, out var name) ? name : string.Empty;
            dto.AppointmentScheduledDateTime = labWork.AppointmentId.HasValue &&
                appointmentTimeMap.TryGetValue(labWork.AppointmentId.Value, out var scheduledDateTime)
                    ? scheduledDateTime
                    : null;
            return dto;
        }).ToList();
    }
}
