using GiapTech.Dentify.Application.Contracts.Patients;
using Riok.Mapperly.Abstractions;
using InsurancePolicyEntity = GiapTech.Dentify.Patients.InsurancePolicy;

namespace GiapTech.Dentify.Application.Patients;

[Mapper]
public partial class InsurancePolicyMapper
{
    [MapperIgnoreSource(nameof(InsurancePolicyEntity.ExtraProperties))]
    [MapperIgnoreSource(nameof(InsurancePolicyEntity.ConcurrencyStamp))]
    public partial InsurancePolicyDto MapToDto(InsurancePolicyEntity insurancePolicy);
}
