using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Services;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using ServiceEntity = GiapTech.Dentify.Services.Service;

namespace GiapTech.Dentify.Application.Services;

[Authorize(DentifyPermissions.Services.Default)]
public class ServiceAppService : ApplicationService, IServiceAppService
{
    private readonly IRepository<ServiceEntity, Guid> _serviceRepository;
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly ServiceMapper _serviceMapper;

    public ServiceAppService(
        IRepository<ServiceEntity, Guid> serviceRepository,
        IRepository<Appointment, Guid> appointmentRepository,
        ServiceMapper serviceMapper)
    {
        _serviceRepository = serviceRepository;
        _appointmentRepository = appointmentRepository;
        _serviceMapper = serviceMapper;
    }

    public virtual async Task<ServiceDto> GetAsync(Guid id)
    {
        var service = await _serviceRepository.GetAsync(id);
        return _serviceMapper.MapToDto(service);
    }

    public virtual async Task<List<ServiceDto>> GetActiveListAsync()
    {
        var queryable = await _serviceRepository.GetQueryableAsync();
        var services = await AsyncExecuter.ToListAsync(queryable.Where(x => x.IsActive));
        return services.Select(_serviceMapper.MapToDto).ToList();
    }

    [Authorize(DentifyPermissions.Services.Create)]
    public virtual async Task<ServiceDto> CreateAsync(CreateUpdateServiceDto input)
    {
        var service = new ServiceEntity(GuidGenerator.Create(), input.Name, input.Price);

        await _serviceRepository.InsertAsync(service);

        return _serviceMapper.MapToDto(service);
    }

    [Authorize(DentifyPermissions.Services.Update)]
    public virtual async Task<ServiceDto> UpdateAsync(Guid id, CreateUpdateServiceDto input)
    {
        var service = await _serviceRepository.GetAsync(id);

        service.SetName(input.Name);
        service.SetPrice(input.Price);

        await _serviceRepository.UpdateAsync(service);

        return _serviceMapper.MapToDto(service);
    }

    [Authorize(DentifyPermissions.Services.Update)]
    public virtual async Task DeactivateAsync(Guid id)
    {
        var service = await _serviceRepository.GetAsync(id);
        service.Deactivate();
        await _serviceRepository.UpdateAsync(service);
    }

    [Authorize(DentifyPermissions.Services.Update)]
    public virtual async Task ActivateAsync(Guid id)
    {
        var service = await _serviceRepository.GetAsync(id);
        service.Activate();
        await _serviceRepository.UpdateAsync(service);
    }

    [Authorize(DentifyPermissions.Services.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        var appointmentQueryable = await _appointmentRepository.GetQueryableAsync();
        var hasAppointments = await AsyncExecuter.AnyAsync(
            appointmentQueryable.Where(a => a.ServiceId == id));
        if (hasAppointments)
        {
            throw new BusinessException(DentifyDomainErrorCodes.ServiceHasAppointments);
        }

        await _serviceRepository.DeleteAsync(id);
    }
}
