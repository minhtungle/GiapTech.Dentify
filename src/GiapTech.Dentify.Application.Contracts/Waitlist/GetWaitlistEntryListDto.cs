using GiapTech.Dentify.Waitlist;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Waitlist;

public class GetWaitlistEntryListDto : PagedAndSortedResultRequestDto
{
    public WaitlistStatus? Status { get; set; }
}
