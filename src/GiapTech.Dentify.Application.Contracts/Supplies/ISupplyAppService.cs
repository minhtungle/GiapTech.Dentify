using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Supplies;

public interface ISupplyAppService : IApplicationService
{
    Task<SupplyDto> GetAsync(Guid id);

    Task<List<SupplyDto>> GetActiveListAsync();

    Task<SupplyDto> CreateAsync(CreateUpdateSupplyDto input);

    Task<SupplyDto> UpdateAsync(Guid id, CreateUpdateSupplyDto input);

    Task<SupplyDto> RestockAsync(Guid id, RestockSupplyDto input);

    Task DeactivateAsync(Guid id);

    Task ActivateAsync(Guid id);

    Task DeleteAsync(Guid id);
}
