using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Doctors;
using GiapTech.Dentify.Doctors;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace GiapTech.Dentify.Application.Doctors;

[Authorize(DentifyPermissions.Doctors.Default)]
public class DoctorAppService : ApplicationService, IDoctorAppService
{
    private readonly IRepository<Doctor, Guid> _doctorRepository;
    private readonly IRepository<IdentityUser, Guid> _identityUserRepository;
    private readonly DoctorMapper _doctorMapper;

    public DoctorAppService(
        IRepository<Doctor, Guid> doctorRepository,
        IRepository<IdentityUser, Guid> identityUserRepository,
        DoctorMapper doctorMapper)
    {
        _doctorRepository = doctorRepository;
        _identityUserRepository = identityUserRepository;
        _doctorMapper = doctorMapper;
    }

    public virtual async Task<DoctorDto> GetAsync(Guid id)
    {
        var doctor = await _doctorRepository.GetAsync(id);
        return (await MapToDtosAsync(new List<Doctor> { doctor })).Single();
    }

    public virtual async Task<List<DoctorDto>> GetActiveListAsync()
    {
        var queryable = await _doctorRepository.GetQueryableAsync();
        var doctors = await AsyncExecuter.ToListAsync(queryable.Where(x => x.IsActive));
        return await MapToDtosAsync(doctors);
    }

    [Authorize(DentifyPermissions.Doctors.Create)]
    public virtual async Task<DoctorDto> CreateAsync(CreateUpdateDoctorDto input)
    {
        await EnsureIdentityUserExistsAsync(input.IdentityUserId);
        await EnsureIdentityUserNotLinkedAsync(input.IdentityUserId, excludeDoctorId: null);

        var doctor = new Doctor(GuidGenerator.Create(), input.IdentityUserId, input.Specialization);

        await _doctorRepository.InsertAsync(doctor);

        return (await MapToDtosAsync(new List<Doctor> { doctor })).Single();
    }

    [Authorize(DentifyPermissions.Doctors.Update)]
    public virtual async Task<DoctorDto> UpdateAsync(Guid id, CreateUpdateDoctorDto input)
    {
        var doctor = await _doctorRepository.GetAsync(id);

        if (doctor.IdentityUserId != input.IdentityUserId)
        {
            await EnsureIdentityUserExistsAsync(input.IdentityUserId);
            await EnsureIdentityUserNotLinkedAsync(input.IdentityUserId, excludeDoctorId: id);
        }

        doctor.SetSpecialization(input.Specialization);

        await _doctorRepository.UpdateAsync(doctor);

        return (await MapToDtosAsync(new List<Doctor> { doctor })).Single();
    }

    [Authorize(DentifyPermissions.Doctors.Update)]
    public virtual async Task DeactivateAsync(Guid id)
    {
        var doctor = await _doctorRepository.GetAsync(id);
        doctor.Deactivate();
        await _doctorRepository.UpdateAsync(doctor);
    }

    [Authorize(DentifyPermissions.Doctors.Update)]
    public virtual async Task ActivateAsync(Guid id)
    {
        var doctor = await _doctorRepository.GetAsync(id);
        doctor.Activate();
        await _doctorRepository.UpdateAsync(doctor);
    }

    [Authorize(DentifyPermissions.Doctors.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _doctorRepository.DeleteAsync(id);
    }

    private async Task EnsureIdentityUserExistsAsync(Guid identityUserId)
    {
        await _identityUserRepository.GetAsync(identityUserId);
    }

    private async Task EnsureIdentityUserNotLinkedAsync(Guid identityUserId, Guid? excludeDoctorId)
    {
        var queryable = await _doctorRepository.GetQueryableAsync();
        var alreadyLinked = await AsyncExecuter.AnyAsync(
            queryable.Where(x => x.IdentityUserId == identityUserId && x.Id != excludeDoctorId));

        if (alreadyLinked)
        {
            throw new BusinessException(DentifyDomainErrorCodes.DoctorAlreadyLinkedToUser);
        }
    }

    private async Task<List<DoctorDto>> MapToDtosAsync(List<Doctor> doctors)
    {
        var userIds = doctors.Select(x => x.IdentityUserId).Distinct().ToList();
        var userQueryable = await _identityUserRepository.GetQueryableAsync();
        var users = await AsyncExecuter.ToListAsync(
            userQueryable.Where(u => userIds.Contains(u.Id)).Select(u => new { u.Id, u.Name }));
        var userNameMap = users.ToDictionary(u => u.Id, u => u.Name);

        return doctors.Select(doctor =>
        {
            var dto = _doctorMapper.MapToDto(doctor);
            dto.FullName = userNameMap.TryGetValue(doctor.IdentityUserId, out var name) ? name : string.Empty;
            return dto;
        }).ToList();
    }
}
