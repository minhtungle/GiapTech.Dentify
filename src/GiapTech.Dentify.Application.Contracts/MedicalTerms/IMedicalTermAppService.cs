using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GiapTech.Dentify.MedicalTerms;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.MedicalTerms;

public interface IMedicalTermAppService : IApplicationService
{
    Task<MedicalTermDto> GetAsync(Guid id);

    Task<List<MedicalTermDto>> GetActiveListAsync(MedicalTermCategory category);

    Task<MedicalTermDto> CreateAsync(CreateUpdateMedicalTermDto input);

    Task<MedicalTermDto> UpdateAsync(Guid id, CreateUpdateMedicalTermDto input);

    Task DeactivateAsync(Guid id);

    Task ActivateAsync(Guid id);

    Task DeleteAsync(Guid id);
}
