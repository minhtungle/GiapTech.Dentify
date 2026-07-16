using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.LabWorks;

public interface ILabWorkAppService : IApplicationService
{
    Task<LabWorkDto> GetAsync(Guid id);

    Task<PagedResultDto<LabWorkDto>> GetListAsync(GetLabWorkListDto input);

    Task<List<LabWorkDto>> GetBoardAsync();

    Task<LabWorkDto> CreateAsync(CreateUpdateLabWorkDto input);

    Task<LabWorkDto> UpdateAsync(Guid id, CreateUpdateLabWorkDto input);

    Task<LabWorkDto> UpdateStatusAsync(Guid id, UpdateLabWorkStatusDto input);

    Task DeleteAsync(Guid id);
}
