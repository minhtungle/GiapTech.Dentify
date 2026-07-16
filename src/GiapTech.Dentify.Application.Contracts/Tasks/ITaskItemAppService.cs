using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Tasks;

public interface ITaskItemAppService : IApplicationService
{
    Task<TaskItemDto> GetAsync(Guid id);

    Task<PagedResultDto<TaskItemDto>> GetListAsync(GetTaskItemListDto input);

    Task<List<TaskItemDto>> GetOverviewListAsync();

    Task<TaskItemDto> CreateAsync(CreateUpdateTaskItemDto input);

    Task<TaskItemDto> UpdateAsync(Guid id, CreateUpdateTaskItemDto input);

    Task<TaskItemDto> ToggleDoneAsync(Guid id);

    Task DeleteAsync(Guid id);
}
