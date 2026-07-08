using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Supplies;
using GiapTech.Dentify.Permissions;
using GiapTech.Dentify.Supplies;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.Supplies;

[Authorize(DentifyPermissions.Supplies.Default)]
public class SupplyAppService : ApplicationService, ISupplyAppService
{
    private readonly IRepository<Supply, Guid> _supplyRepository;
    private readonly SupplyMapper _supplyMapper;

    public SupplyAppService(
        IRepository<Supply, Guid> supplyRepository,
        SupplyMapper supplyMapper)
    {
        _supplyRepository = supplyRepository;
        _supplyMapper = supplyMapper;
    }

    public virtual async Task<SupplyDto> GetAsync(Guid id)
    {
        var supply = await _supplyRepository.GetAsync(id);
        return _supplyMapper.MapToDto(supply);
    }

    public virtual async Task<List<SupplyDto>> GetActiveListAsync()
    {
        var queryable = await _supplyRepository.GetQueryableAsync();
        var supplies = await AsyncExecuter.ToListAsync(queryable.Where(x => x.IsActive));
        return supplies.Select(_supplyMapper.MapToDto).ToList();
    }

    [Authorize(DentifyPermissions.Supplies.Create)]
    public virtual async Task<SupplyDto> CreateAsync(CreateUpdateSupplyDto input)
    {
        var supply = new Supply(GuidGenerator.Create(), input.Name, input.Unit, input.LowStockThreshold);

        await _supplyRepository.InsertAsync(supply);

        return _supplyMapper.MapToDto(supply);
    }

    [Authorize(DentifyPermissions.Supplies.Update)]
    public virtual async Task<SupplyDto> UpdateAsync(Guid id, CreateUpdateSupplyDto input)
    {
        var supply = await _supplyRepository.GetAsync(id);

        supply.SetName(input.Name);
        supply.SetUnit(input.Unit);
        supply.SetLowStockThreshold(input.LowStockThreshold);

        await _supplyRepository.UpdateAsync(supply);

        return _supplyMapper.MapToDto(supply);
    }

    [Authorize(DentifyPermissions.Supplies.Update)]
    public virtual async Task<SupplyDto> RestockAsync(Guid id, RestockSupplyDto input)
    {
        var supply = await _supplyRepository.GetAsync(id);

        supply.IncreaseQuantity(input.Quantity);

        await _supplyRepository.UpdateAsync(supply);

        return _supplyMapper.MapToDto(supply);
    }

    [Authorize(DentifyPermissions.Supplies.Update)]
    public virtual async Task DeactivateAsync(Guid id)
    {
        var supply = await _supplyRepository.GetAsync(id);
        supply.Deactivate();
        await _supplyRepository.UpdateAsync(supply);
    }

    [Authorize(DentifyPermissions.Supplies.Update)]
    public virtual async Task ActivateAsync(Guid id)
    {
        var supply = await _supplyRepository.GetAsync(id);
        supply.Activate();
        await _supplyRepository.UpdateAsync(supply);
    }

    [Authorize(DentifyPermissions.Supplies.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _supplyRepository.DeleteAsync(id);
    }
}
