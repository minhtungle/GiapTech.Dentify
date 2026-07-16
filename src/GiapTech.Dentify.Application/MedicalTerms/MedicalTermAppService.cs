using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.MedicalTerms;
using GiapTech.Dentify.MedicalTerms;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.MedicalTerms;

[Authorize(DentifyPermissions.MedicalTerms.Default)]
public class MedicalTermAppService : ApplicationService, IMedicalTermAppService
{
    private readonly IRepository<MedicalTerm, Guid> _medicalTermRepository;
    private readonly MedicalTermMapper _medicalTermMapper;

    public MedicalTermAppService(
        IRepository<MedicalTerm, Guid> medicalTermRepository,
        MedicalTermMapper medicalTermMapper)
    {
        _medicalTermRepository = medicalTermRepository;
        _medicalTermMapper = medicalTermMapper;
    }

    public virtual async Task<MedicalTermDto> GetAsync(Guid id)
    {
        var medicalTerm = await _medicalTermRepository.GetAsync(id);
        return _medicalTermMapper.MapToDto(medicalTerm);
    }

    public virtual async Task<List<MedicalTermDto>> GetActiveListAsync(MedicalTermCategory category)
    {
        var queryable = await _medicalTermRepository.GetQueryableAsync();
        var medicalTerms = await AsyncExecuter.ToListAsync(
            queryable.Where(x => x.IsActive && x.Category == category).OrderBy(x => x.Name));
        return medicalTerms.Select(_medicalTermMapper.MapToDto).ToList();
    }

    [Authorize(DentifyPermissions.MedicalTerms.Create)]
    public virtual async Task<MedicalTermDto> CreateAsync(CreateUpdateMedicalTermDto input)
    {
        var medicalTerm = new MedicalTerm(GuidGenerator.Create(), input.Name, input.Category);

        await _medicalTermRepository.InsertAsync(medicalTerm);

        return _medicalTermMapper.MapToDto(medicalTerm);
    }

    [Authorize(DentifyPermissions.MedicalTerms.Update)]
    public virtual async Task<MedicalTermDto> UpdateAsync(Guid id, CreateUpdateMedicalTermDto input)
    {
        var medicalTerm = await _medicalTermRepository.GetAsync(id);

        medicalTerm.SetName(input.Name);

        await _medicalTermRepository.UpdateAsync(medicalTerm);

        return _medicalTermMapper.MapToDto(medicalTerm);
    }

    [Authorize(DentifyPermissions.MedicalTerms.Update)]
    public virtual async Task DeactivateAsync(Guid id)
    {
        var medicalTerm = await _medicalTermRepository.GetAsync(id);
        medicalTerm.Deactivate();
        await _medicalTermRepository.UpdateAsync(medicalTerm);
    }

    [Authorize(DentifyPermissions.MedicalTerms.Update)]
    public virtual async Task ActivateAsync(Guid id)
    {
        var medicalTerm = await _medicalTermRepository.GetAsync(id);
        medicalTerm.Activate();
        await _medicalTermRepository.UpdateAsync(medicalTerm);
    }

    [Authorize(DentifyPermissions.MedicalTerms.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _medicalTermRepository.DeleteAsync(id);
    }
}
