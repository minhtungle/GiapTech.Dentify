using GiapTech.Dentify.Application.Contracts.Services;
using Riok.Mapperly.Abstractions;
using ServiceEntity = GiapTech.Dentify.Services.Service;

namespace GiapTech.Dentify.Application.Services;

[Mapper]
public partial class ServiceMapper
{
    [MapperIgnoreSource(nameof(ServiceEntity.ExtraProperties))]
    [MapperIgnoreSource(nameof(ServiceEntity.ConcurrencyStamp))]
    public partial ServiceDto MapToDto(ServiceEntity service);
}
