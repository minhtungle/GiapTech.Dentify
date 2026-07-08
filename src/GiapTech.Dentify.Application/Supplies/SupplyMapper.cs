using GiapTech.Dentify.Application.Contracts.Supplies;
using GiapTech.Dentify.Supplies;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Supplies;

[Mapper]
public partial class SupplyMapper
{
    [MapperIgnoreSource(nameof(Supply.ExtraProperties))]
    [MapperIgnoreSource(nameof(Supply.ConcurrencyStamp))]
    public partial SupplyDto MapToDto(Supply supply);
}
