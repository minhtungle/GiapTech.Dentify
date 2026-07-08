using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Drugs;

public interface IDrugAppService : IApplicationService
{
    Task<DrugDto> GetAsync(Guid id);

    Task<List<DrugDto>> GetActiveListAsync();

    Task<DrugDto> CreateAsync(CreateUpdateDrugDto input);

    Task<DrugDto> UpdateAsync(Guid id, CreateUpdateDrugDto input);

    Task DeactivateAsync(Guid id);

    Task ActivateAsync(Guid id);

    Task DeleteAsync(Guid id);
}
