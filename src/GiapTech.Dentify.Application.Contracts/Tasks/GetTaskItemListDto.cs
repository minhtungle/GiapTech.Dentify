using GiapTech.Dentify.Tasks;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Tasks;

public class GetTaskItemListDto : PagedAndSortedResultRequestDto
{
    public bool? IsDone { get; set; }
    public TaskPriority? Priority { get; set; }
}
