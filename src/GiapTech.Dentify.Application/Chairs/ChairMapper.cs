using GiapTech.Dentify.Application.Contracts.Chairs;
using GiapTech.Dentify.Chairs;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Chairs;

[Mapper]
public partial class ChairMapper
{
    [MapperIgnoreSource(nameof(Chair.ExtraProperties))]
    [MapperIgnoreSource(nameof(Chair.ConcurrencyStamp))]
    public partial ChairDto MapToDto(Chair chair);
}
