using System;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Supplies;
using GiapTech.Dentify.Permissions;
using GiapTech.Dentify.Supplies;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.Supplies;

[Authorize(DentifyPermissions.Supplies.Default)]
public class SupplyUsageAppService : ApplicationService, ISupplyUsageAppService
{
    private readonly IRepository<SupplyUsage, Guid> _supplyUsageRepository;
    private readonly IRepository<Supply, Guid> _supplyRepository;

    public SupplyUsageAppService(
        IRepository<SupplyUsage, Guid> supplyUsageRepository,
        IRepository<Supply, Guid> supplyRepository)
    {
        _supplyUsageRepository = supplyUsageRepository;
        _supplyRepository = supplyRepository;
    }

    public virtual async Task<PagedResultDto<SupplyUsageDto>> GetListAsync(GetSupplyUsageListDto input)
    {
        var queryable = await _supplyUsageRepository.GetQueryableAsync();

        if (input.SupplyId.HasValue)
        {
            queryable = queryable.Where(x => x.SupplyId == input.SupplyId.Value);
        }

        if (input.AppointmentId.HasValue)
        {
            queryable = queryable.Where(x => x.AppointmentId == input.AppointmentId.Value);
        }

        var totalCount = await AsyncExecuter.CountAsync(queryable);

        queryable = queryable.OrderByDescending(x => x.UsedAt);

        var usages = await AsyncExecuter.ToListAsync(
            queryable.Skip(input.SkipCount).Take(input.MaxResultCount));

        var supplyIds = usages.Select(x => x.SupplyId).Distinct().ToList();
        var supplyQueryable = await _supplyRepository.GetQueryableAsync();
        var supplies = await AsyncExecuter.ToListAsync(
            supplyQueryable.Where(s => supplyIds.Contains(s.Id)).Select(s => new { s.Id, s.Name }));
        var supplyNameMap = supplies.ToDictionary(s => s.Id, s => s.Name);

        var dtos = usages.Select(usage => new SupplyUsageDto
        {
            Id = usage.Id,
            SupplyId = usage.SupplyId,
            SupplyName = supplyNameMap.TryGetValue(usage.SupplyId, out var name) ? name : string.Empty,
            Quantity = usage.Quantity,
            AppointmentId = usage.AppointmentId,
            UsedAt = usage.UsedAt,
            Notes = usage.Notes,
            CreationTime = usage.CreationTime
        }).ToList();

        return new PagedResultDto<SupplyUsageDto>(totalCount, dtos);
    }

    [Authorize(DentifyPermissions.Supplies.Update)]
    public virtual async Task<SupplyUsageDto> CreateAsync(CreateSupplyUsageDto input)
    {
        var supply = await _supplyRepository.GetAsync(input.SupplyId);

        supply.DecreaseQuantity(input.Quantity);
        await _supplyRepository.UpdateAsync(supply);

        var usage = new SupplyUsage(
            GuidGenerator.Create(),
            input.SupplyId,
            input.Quantity,
            input.UsedAt,
            input.AppointmentId,
            input.Notes);

        await _supplyUsageRepository.InsertAsync(usage);

        return new SupplyUsageDto
        {
            Id = usage.Id,
            SupplyId = usage.SupplyId,
            SupplyName = supply.Name,
            Quantity = usage.Quantity,
            AppointmentId = usage.AppointmentId,
            UsedAt = usage.UsedAt,
            Notes = usage.Notes,
            CreationTime = usage.CreationTime
        };
    }

    [Authorize(DentifyPermissions.Supplies.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        var usage = await _supplyUsageRepository.FindAsync(id);
        if (usage == null)
        {
            throw new BusinessException(DentifyDomainErrorCodes.SupplyNotFound);
        }

        var supply = await _supplyRepository.GetAsync(usage.SupplyId);
        supply.IncreaseQuantity(usage.Quantity);
        await _supplyRepository.UpdateAsync(supply);

        await _supplyUsageRepository.DeleteAsync(usage);
    }
}
