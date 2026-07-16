using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public interface IInsurancePolicyAppService : IApplicationService
{
    Task<List<InsurancePolicyDto>> GetListAsync(Guid patientId);

    Task<InsurancePolicyDto> CreateAsync(CreateUpdateInsurancePolicyDto input);

    Task<InsurancePolicyDto> UpdateAsync(Guid id, CreateUpdateInsurancePolicyDto input);

    Task DeleteAsync(Guid id);
}
