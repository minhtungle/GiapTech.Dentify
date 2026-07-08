using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Waitlist;

public interface IWaitlistEntryAppService : IApplicationService
{
    Task<WaitlistEntryDto> GetAsync(Guid id);

    Task<PagedResultDto<WaitlistEntryDto>> GetListAsync(GetWaitlistEntryListDto input);

    Task<WaitlistEntryDto> CreateAsync(CreateUpdateWaitlistEntryDto input);

    Task<WaitlistEntryDto> UpdateAsync(Guid id, CreateUpdateWaitlistEntryDto input);

    Task<WaitlistEntryDto> ChangeStatusAsync(Guid id, ChangeWaitlistEntryStatusDto input);

    Task DeleteAsync(Guid id);
}
