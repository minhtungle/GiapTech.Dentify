using GiapTech.Dentify.Application.Contracts.Drugs;
using GiapTech.Dentify.Drugs;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Drugs;

[Mapper]
public partial class DrugMapper
{
    [MapperIgnoreSource(nameof(Drug.ExtraProperties))]
    [MapperIgnoreSource(nameof(Drug.ConcurrencyStamp))]
    public partial DrugDto MapToDto(Drug drug);
}
