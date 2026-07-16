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
using Volo.Abp.DistributedLocking;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.Supplies;

[Authorize(DentifyPermissions.Supplies.Default)]
public class SupplyUsageAppService : ApplicationService, ISupplyUsageAppService
{
    private readonly IRepository<SupplyUsage, Guid> _supplyUsageRepository;
    private readonly IRepository<Supply, Guid> _supplyRepository;
    private readonly IAbpDistributedLock _distributedLock;

    public SupplyUsageAppService(
        IRepository<SupplyUsage, Guid> supplyUsageRepository,
        IRepository<Supply, Guid> supplyRepository,
        IAbpDistributedLock distributedLock)
    {
        _supplyUsageRepository = supplyUsageRepository;
        _supplyRepository = supplyRepository;
        _distributedLock = distributedLock;
    }

    // Bọc đọc-sửa-ghi Quantity trong 1 distributed lock theo Supply để loại bỏ khoảng hở
    // TOCTOU giữa lúc đọc Quantity hiện tại và lúc ghi lại (2 request ghi nhận sử dụng
    // đồng thời cho cùng 1 vật tư có thể cùng đọc số lượng cũ trước khi bên nào update
    // xong) — cùng pattern với AppointmentAppService.AcquireDoubleBookingLockAsync.
    private async Task<IAbpDistributedLockHandle> AcquireSupplyLockAsync(Guid supplyId)
    {
        var handle = await _distributedLock.TryAcquireAsync($"supply-{supplyId}", TimeSpan.FromSeconds(10));
        if (handle == null)
        {
            throw new BusinessException(DentifyDomainErrorCodes.ResourceLockTimeout);
        }

        return handle;
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
        await using var lockHandle = await AcquireSupplyLockAsync(input.SupplyId);

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

        await using var lockHandle = await AcquireSupplyLockAsync(usage.SupplyId);

        var supply = await _supplyRepository.GetAsync(usage.SupplyId);
        supply.IncreaseQuantity(usage.Quantity);
        await _supplyRepository.UpdateAsync(supply);

        await _supplyUsageRepository.DeleteAsync(usage);
    }
}
