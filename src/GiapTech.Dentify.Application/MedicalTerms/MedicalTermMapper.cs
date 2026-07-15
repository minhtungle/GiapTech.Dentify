using GiapTech.Dentify.Application.Contracts.MedicalTerms;
using GiapTech.Dentify.MedicalTerms;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.MedicalTerms;

[Mapper]
public partial class MedicalTermMapper
{
    [MapperIgnoreSource(nameof(MedicalTerm.ExtraProperties))]
    [MapperIgnoreSource(nameof(MedicalTerm.ConcurrencyStamp))]
    public partial MedicalTermDto MapToDto(MedicalTerm medicalTerm);
}
