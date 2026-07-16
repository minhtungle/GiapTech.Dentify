using GiapTech.Dentify.Application.Contracts.Tasks;
using GiapTech.Dentify.Tasks;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Tasks;

[Mapper]
public partial class TaskItemMapper
{
    [MapperIgnoreSource(nameof(TaskItem.ExtraProperties))]
    [MapperIgnoreSource(nameof(TaskItem.ConcurrencyStamp))]
    public partial TaskItemDto MapToDto(TaskItem taskItem);
}
