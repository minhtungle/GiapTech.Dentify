using System;
using GiapTech.Dentify.Tasks;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Tasks;

public class TaskItemDto : FullAuditedEntityDto<Guid>
{
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public bool IsDone { get; set; }
    public TaskPriority Priority { get; set; }
    public DateTime? DueDate { get; set; }
}
