using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Tasks;
using GiapTech.Dentify.Permissions;
using GiapTech.Dentify.Tasks;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.Tasks;

[Authorize(DentifyPermissions.Tasks.Default)]
public class TaskItemAppService : ApplicationService, ITaskItemAppService
{
    private readonly IRepository<TaskItem, Guid> _taskItemRepository;
    private readonly TaskItemMapper _taskItemMapper;

    public TaskItemAppService(IRepository<TaskItem, Guid> taskItemRepository, TaskItemMapper taskItemMapper)
    {
        _taskItemRepository = taskItemRepository;
        _taskItemMapper = taskItemMapper;
    }

    public virtual async Task<TaskItemDto> GetAsync(Guid id)
    {
        var taskItem = await _taskItemRepository.GetAsync(id);
        return _taskItemMapper.MapToDto(taskItem);
    }

    public virtual async Task<PagedResultDto<TaskItemDto>> GetListAsync(GetTaskItemListDto input)
    {
        var queryable = await _taskItemRepository.GetQueryableAsync();

        if (input.IsDone.HasValue)
        {
            queryable = queryable.Where(x => x.IsDone == input.IsDone.Value);
        }

        if (input.Priority.HasValue)
        {
            queryable = queryable.Where(x => x.Priority == input.Priority.Value);
        }

        var totalCount = await AsyncExecuter.CountAsync(queryable);

        queryable = queryable
            .OrderBy(x => x.IsDone)
            .ThenBy(x => x.DueDate ?? DateTime.MaxValue)
            .ThenByDescending(x => x.CreationTime);

        var taskItems = await AsyncExecuter.ToListAsync(
            queryable.Skip(input.SkipCount).Take(input.MaxResultCount));

        return new PagedResultDto<TaskItemDto>(totalCount, taskItems.Select(_taskItemMapper.MapToDto).ToList());
    }

    public virtual async Task<List<TaskItemDto>> GetOverviewListAsync()
    {
        var queryable = await _taskItemRepository.GetQueryableAsync();

        var taskItems = await AsyncExecuter.ToListAsync(
            queryable
                .Where(x => !x.IsDone)
                .OrderBy(x => x.DueDate ?? DateTime.MaxValue)
                .ThenByDescending(x => x.Priority)
                .Take(5));

        return taskItems.Select(_taskItemMapper.MapToDto).ToList();
    }

    [Authorize(DentifyPermissions.Tasks.Create)]
    public virtual async Task<TaskItemDto> CreateAsync(CreateUpdateTaskItemDto input)
    {
        var taskItem = new TaskItem(GuidGenerator.Create(), input.Title, input.Content, input.Priority, input.DueDate);

        await _taskItemRepository.InsertAsync(taskItem);

        return _taskItemMapper.MapToDto(taskItem);
    }

    [Authorize(DentifyPermissions.Tasks.Update)]
    public virtual async Task<TaskItemDto> UpdateAsync(Guid id, CreateUpdateTaskItemDto input)
    {
        var taskItem = await _taskItemRepository.GetAsync(id);

        taskItem.SetTitle(input.Title);
        taskItem.SetContent(input.Content);
        taskItem.SetPriority(input.Priority);
        taskItem.SetDueDate(input.DueDate);

        await _taskItemRepository.UpdateAsync(taskItem);

        return _taskItemMapper.MapToDto(taskItem);
    }

    [Authorize(DentifyPermissions.Tasks.Update)]
    public virtual async Task<TaskItemDto> ToggleDoneAsync(Guid id)
    {
        var taskItem = await _taskItemRepository.GetAsync(id);

        if (taskItem.IsDone)
        {
            taskItem.MarkAsPending();
        }
        else
        {
            taskItem.MarkAsDone();
        }

        await _taskItemRepository.UpdateAsync(taskItem);

        return _taskItemMapper.MapToDto(taskItem);
    }

    [Authorize(DentifyPermissions.Tasks.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _taskItemRepository.DeleteAsync(id);
    }
}
