using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Chairs;

public interface IChairAppService : IApplicationService
{
    Task<ChairDto> GetAsync(Guid id);

    Task<List<ChairDto>> GetActiveListAsync();

    Task<ChairDto> CreateAsync(CreateUpdateChairDto input);

    Task<ChairDto> UpdateAsync(Guid id, CreateUpdateChairDto input);

    Task DeactivateAsync(Guid id);

    Task ActivateAsync(Guid id);

    Task DeleteAsync(Guid id);
}
