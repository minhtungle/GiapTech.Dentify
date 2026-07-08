using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Waitlist;
using GiapTech.Dentify.Doctors;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using ServiceEntity = GiapTech.Dentify.Services.Service;
using WaitlistEntryEntity = GiapTech.Dentify.Waitlist.WaitlistEntry;

namespace GiapTech.Dentify.Application.Waitlist;

[Authorize(DentifyPermissions.Waitlist.Default)]
public class WaitlistEntryAppService : ApplicationService, IWaitlistEntryAppService
{
    private readonly IRepository<WaitlistEntryEntity, Guid> _waitlistEntryRepository;
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly IRepository<Doctor, Guid> _doctorRepository;
    private readonly IRepository<ServiceEntity, Guid> _serviceRepository;
    private readonly IRepository<IdentityUser, Guid> _identityUserRepository;
    private readonly WaitlistEntryMapper _waitlistEntryMapper;

    public WaitlistEntryAppService(
        IRepository<WaitlistEntryEntity, Guid> waitlistEntryRepository,
        IRepository<Patient, Guid> patientRepository,
        IRepository<Doctor, Guid> doctorRepository,
        IRepository<ServiceEntity, Guid> serviceRepository,
        IRepository<IdentityUser, Guid> identityUserRepository,
        WaitlistEntryMapper waitlistEntryMapper)
    {
        _waitlistEntryRepository = waitlistEntryRepository;
        _patientRepository = patientRepository;
        _doctorRepository = doctorRepository;
        _serviceRepository = serviceRepository;
        _identityUserRepository = identityUserRepository;
        _waitlistEntryMapper = waitlistEntryMapper;
    }

    public virtual async Task<WaitlistEntryDto> GetAsync(Guid id)
    {
        var entry = await _waitlistEntryRepository.GetAsync(id);
        return (await MapToDtosAsync(new List<WaitlistEntryEntity> { entry })).Single();
    }

    public virtual async Task<PagedResultDto<WaitlistEntryDto>> GetListAsync(GetWaitlistEntryListDto input)
    {
        var queryable = await _waitlistEntryRepository.GetQueryableAsync();

        if (input.Status.HasValue)
        {
            queryable = queryable.Where(x => x.Status == input.Status.Value);
        }

        var totalCount = await AsyncExecuter.CountAsync(queryable);

        queryable = queryable.OrderByDescending(x => x.CreationTime);

        var entries = await AsyncExecuter.ToListAsync(
            queryable.Skip(input.SkipCount).Take(input.MaxResultCount));

        return new PagedResultDto<WaitlistEntryDto>(totalCount, await MapToDtosAsync(entries));
    }

    [Authorize(DentifyPermissions.Waitlist.Create)]
    public virtual async Task<WaitlistEntryDto> CreateAsync(CreateUpdateWaitlistEntryDto input)
    {
        await _patientRepository.GetAsync(input.PatientId);

        var entry = new WaitlistEntryEntity(
            GuidGenerator.Create(),
            input.PatientId,
            input.DoctorId,
            input.ServiceId,
            input.PreferredTimeNote,
            input.Notes);

        await _waitlistEntryRepository.InsertAsync(entry);

        return (await MapToDtosAsync(new List<WaitlistEntryEntity> { entry })).Single();
    }

    [Authorize(DentifyPermissions.Waitlist.Update)]
    public virtual async Task<WaitlistEntryDto> UpdateAsync(Guid id, CreateUpdateWaitlistEntryDto input)
    {
        var entry = await _waitlistEntryRepository.GetAsync(id);

        await _patientRepository.GetAsync(input.PatientId);

        entry.UpdateDetails(input.PatientId, input.DoctorId, input.ServiceId, input.PreferredTimeNote, input.Notes);

        await _waitlistEntryRepository.UpdateAsync(entry);

        return (await MapToDtosAsync(new List<WaitlistEntryEntity> { entry })).Single();
    }

    [Authorize(DentifyPermissions.Waitlist.Update)]
    public virtual async Task<WaitlistEntryDto> ChangeStatusAsync(Guid id, ChangeWaitlistEntryStatusDto input)
    {
        var entry = await _waitlistEntryRepository.GetAsync(id);

        entry.ChangeStatus(input.Status);

        await _waitlistEntryRepository.UpdateAsync(entry);

        return (await MapToDtosAsync(new List<WaitlistEntryEntity> { entry })).Single();
    }

    [Authorize(DentifyPermissions.Waitlist.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _waitlistEntryRepository.DeleteAsync(id);
    }

    private async Task<List<WaitlistEntryDto>> MapToDtosAsync(List<WaitlistEntryEntity> entries)
    {
        var patientIds = entries.Select(x => x.PatientId).Distinct().ToList();
        var patientQueryable = await _patientRepository.GetQueryableAsync();
        var patientNames = await AsyncExecuter.ToListAsync(
            patientQueryable.Where(p => patientIds.Contains(p.Id)).Select(p => new { p.Id, p.FullName }));
        var patientNameMap = patientNames.ToDictionary(p => p.Id, p => p.FullName);

        var doctorIds = entries.Where(x => x.DoctorId.HasValue).Select(x => x.DoctorId!.Value).Distinct().ToList();
        var doctorQueryable = await _doctorRepository.GetQueryableAsync();
        var doctors = await AsyncExecuter.ToListAsync(doctorQueryable.Where(d => doctorIds.Contains(d.Id)));
        var doctorUserIdMap = doctors.ToDictionary(d => d.Id, d => d.IdentityUserId);

        var doctorUserIds = doctors.Select(d => d.IdentityUserId).Distinct().ToList();
        var userQueryable = await _identityUserRepository.GetQueryableAsync();
        var doctorUsers = await AsyncExecuter.ToListAsync(
            userQueryable.Where(u => doctorUserIds.Contains(u.Id)).Select(u => new { u.Id, u.Name }));
        var doctorUserNameMap = doctorUsers.ToDictionary(u => u.Id, u => u.Name);

        var serviceIds = entries.Where(x => x.ServiceId.HasValue).Select(x => x.ServiceId!.Value).Distinct().ToList();
        var serviceQueryable = await _serviceRepository.GetQueryableAsync();
        var services = await AsyncExecuter.ToListAsync(
            serviceQueryable.Where(s => serviceIds.Contains(s.Id)).Select(s => new { s.Id, s.Name }));
        var serviceNameMap = services.ToDictionary(s => s.Id, s => s.Name);

        return entries.Select(entry =>
        {
            var dto = _waitlistEntryMapper.MapToDto(entry);
            dto.PatientFullName = patientNameMap.TryGetValue(entry.PatientId, out var patientName) ? patientName : string.Empty;
            dto.DoctorName = entry.DoctorId.HasValue
                && doctorUserIdMap.TryGetValue(entry.DoctorId.Value, out var doctorUserId)
                && doctorUserNameMap.TryGetValue(doctorUserId, out var doctorName)
                    ? doctorName
                    : null;
            dto.ServiceName = entry.ServiceId.HasValue
                && serviceNameMap.TryGetValue(entry.ServiceId.Value, out var serviceName)
                    ? serviceName
                    : null;
            return dto;
        }).ToList();
    }
}
