using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Supplies;

public interface ISupplyUsageAppService : IApplicationService
{
    Task<PagedResultDto<SupplyUsageDto>> GetListAsync(GetSupplyUsageListDto input);

    Task<SupplyUsageDto> CreateAsync(CreateSupplyUsageDto input);

    Task DeleteAsync(Guid id);
}
