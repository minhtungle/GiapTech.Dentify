using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Tasks;

public class TaskItem : FullAuditedAggregateRoot<Guid>
{
    public string Title { get; private set; } = null!;
    public string? Content { get; private set; }
    public bool IsDone { get; private set; }
    public TaskPriority Priority { get; private set; }
    public DateTime? DueDate { get; private set; }

    protected TaskItem()
    {
    }

    public TaskItem(Guid id, string title, string? content = null, TaskPriority priority = TaskPriority.Medium, DateTime? dueDate = null)
        : base(id)
    {
        SetTitle(title);
        SetContent(content);
        Priority = priority;
        SetDueDate(dueDate);
        IsDone = false;
    }

    public void SetTitle(string title)
    {
        Title = Check.Length(
            Check.NotNullOrWhiteSpace(title, nameof(title))!,
            nameof(title),
            TaskConsts.MaxTitleLength)!;
    }

    public void SetContent(string? content)
    {
        Content = Check.Length(content, nameof(content), TaskConsts.MaxContentLength);
    }

    public void SetPriority(TaskPriority priority)
    {
        Priority = priority;
    }

    public void SetDueDate(DateTime? dueDate)
    {
        DueDate = dueDate.HasValue ? DateTime.SpecifyKind(dueDate.Value, DateTimeKind.Utc) : null;
    }

    public void MarkAsDone()
    {
        IsDone = true;
    }

    public void MarkAsPending()
    {
        IsDone = false;
    }
}
