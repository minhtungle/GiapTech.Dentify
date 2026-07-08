using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using InsurancePolicyEntity = GiapTech.Dentify.Patients.InsurancePolicy;

namespace GiapTech.Dentify.Application.Patients;

[Authorize(DentifyPermissions.InsurancePolicies.Default)]
public class InsurancePolicyAppService : ApplicationService, IInsurancePolicyAppService
{
    private readonly IRepository<InsurancePolicyEntity, Guid> _insurancePolicyRepository;
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly InsurancePolicyMapper _insurancePolicyMapper;

    public InsurancePolicyAppService(
        IRepository<InsurancePolicyEntity, Guid> insurancePolicyRepository,
        IRepository<Patient, Guid> patientRepository,
        InsurancePolicyMapper insurancePolicyMapper)
    {
        _insurancePolicyRepository = insurancePolicyRepository;
        _patientRepository = patientRepository;
        _insurancePolicyMapper = insurancePolicyMapper;
    }

    public virtual async Task<List<InsurancePolicyDto>> GetListAsync(Guid patientId)
    {
        var queryable = await _insurancePolicyRepository.GetQueryableAsync();
        var policies = await AsyncExecuter.ToListAsync(
            queryable.Where(x => x.PatientId == patientId).OrderByDescending(x => x.EffectiveDate));
        return policies.Select(_insurancePolicyMapper.MapToDto).ToList();
    }

    [Authorize(DentifyPermissions.InsurancePolicies.Create)]
    public virtual async Task<InsurancePolicyDto> CreateAsync(CreateUpdateInsurancePolicyDto input)
    {
        await _patientRepository.GetAsync(input.PatientId);

        var policy = new InsurancePolicyEntity(
            GuidGenerator.Create(),
            input.PatientId,
            input.ProviderName,
            input.PolicyNumber,
            input.EffectiveDate,
            input.ExpiryDate,
            input.Notes);

        await _insurancePolicyRepository.InsertAsync(policy);

        return _insurancePolicyMapper.MapToDto(policy);
    }

    [Authorize(DentifyPermissions.InsurancePolicies.Update)]
    public virtual async Task<InsurancePolicyDto> UpdateAsync(Guid id, CreateUpdateInsurancePolicyDto input)
    {
        var policy = await _insurancePolicyRepository.GetAsync(id);

        policy.SetProviderName(input.ProviderName);
        policy.SetPolicyNumber(input.PolicyNumber);
        policy.SetDates(input.EffectiveDate, input.ExpiryDate);
        policy.SetNotes(input.Notes);

        await _insurancePolicyRepository.UpdateAsync(policy);

        return _insurancePolicyMapper.MapToDto(policy);
    }

    [Authorize(DentifyPermissions.InsurancePolicies.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _insurancePolicyRepository.DeleteAsync(id);
    }
}
