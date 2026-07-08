using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Chairs;
using GiapTech.Dentify.Chairs;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.Chairs;

[Authorize(DentifyPermissions.Chairs.Default)]
public class ChairAppService : ApplicationService, IChairAppService
{
    private readonly IRepository<Chair, Guid> _chairRepository;
    private readonly ChairMapper _chairMapper;

    public ChairAppService(
        IRepository<Chair, Guid> chairRepository,
        ChairMapper chairMapper)
    {
        _chairRepository = chairRepository;
        _chairMapper = chairMapper;
    }

    public virtual async Task<ChairDto> GetAsync(Guid id)
    {
        var chair = await _chairRepository.GetAsync(id);
        return _chairMapper.MapToDto(chair);
    }

    public virtual async Task<List<ChairDto>> GetActiveListAsync()
    {
        var queryable = await _chairRepository.GetQueryableAsync();
        var chairs = await AsyncExecuter.ToListAsync(queryable.Where(x => x.IsActive));
        return chairs.Select(_chairMapper.MapToDto).ToList();
    }

    [Authorize(DentifyPermissions.Chairs.Create)]
    public virtual async Task<ChairDto> CreateAsync(CreateUpdateChairDto input)
    {
        var chair = new Chair(GuidGenerator.Create(), input.Name);

        await _chairRepository.InsertAsync(chair);

        return _chairMapper.MapToDto(chair);
    }

    [Authorize(DentifyPermissions.Chairs.Update)]
    public virtual async Task<ChairDto> UpdateAsync(Guid id, CreateUpdateChairDto input)
    {
        var chair = await _chairRepository.GetAsync(id);

        chair.SetName(input.Name);

        await _chairRepository.UpdateAsync(chair);

        return _chairMapper.MapToDto(chair);
    }

    [Authorize(DentifyPermissions.Chairs.Update)]
    public virtual async Task DeactivateAsync(Guid id)
    {
        var chair = await _chairRepository.GetAsync(id);
        chair.Deactivate();
        await _chairRepository.UpdateAsync(chair);
    }

    [Authorize(DentifyPermissions.Chairs.Update)]
    public virtual async Task ActivateAsync(Guid id)
    {
        var chair = await _chairRepository.GetAsync(id);
        chair.Activate();
        await _chairRepository.UpdateAsync(chair);
    }

    [Authorize(DentifyPermissions.Chairs.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _chairRepository.DeleteAsync(id);
    }
}
