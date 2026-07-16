using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Services;

public interface IServiceAppService : IApplicationService
{
    Task<ServiceDto> GetAsync(Guid id);

    Task<List<ServiceDto>> GetActiveListAsync();

    Task<ServiceDto> CreateAsync(CreateUpdateServiceDto input);

    Task<ServiceDto> UpdateAsync(Guid id, CreateUpdateServiceDto input);

    Task DeactivateAsync(Guid id);

    Task ActivateAsync(Guid id);

    Task DeleteAsync(Guid id);
}
