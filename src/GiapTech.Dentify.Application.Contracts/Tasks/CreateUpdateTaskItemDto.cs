using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Tasks;

namespace GiapTech.Dentify.Application.Contracts.Tasks;

public class CreateUpdateTaskItemDto
{
    [Required]
    [StringLength(TaskConsts.MaxTitleLength)]
    public string Title { get; set; } = string.Empty;

    [StringLength(TaskConsts.MaxContentLength)]
    public string? Content { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public DateTime? DueDate { get; set; }
}
