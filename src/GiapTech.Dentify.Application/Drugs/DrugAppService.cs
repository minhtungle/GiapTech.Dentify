using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Drugs;
using GiapTech.Dentify.Drugs;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.Drugs;

[Authorize(DentifyPermissions.Drugs.Default)]
public class DrugAppService : ApplicationService, IDrugAppService
{
    private readonly IRepository<Drug, Guid> _drugRepository;
    private readonly DrugMapper _drugMapper;

    public DrugAppService(
        IRepository<Drug, Guid> drugRepository,
        DrugMapper drugMapper)
    {
        _drugRepository = drugRepository;
        _drugMapper = drugMapper;
    }

    public virtual async Task<DrugDto> GetAsync(Guid id)
    {
        var drug = await _drugRepository.GetAsync(id);
        return _drugMapper.MapToDto(drug);
    }

    public virtual async Task<List<DrugDto>> GetActiveListAsync()
    {
        var queryable = await _drugRepository.GetQueryableAsync();
        var drugs = await AsyncExecuter.ToListAsync(queryable.Where(x => x.IsActive));
        return drugs.Select(_drugMapper.MapToDto).ToList();
    }

    [Authorize(DentifyPermissions.Drugs.Create)]
    public virtual async Task<DrugDto> CreateAsync(CreateUpdateDrugDto input)
    {
        var drug = new Drug(GuidGenerator.Create(), input.Name, input.DefaultDosage);

        await _drugRepository.InsertAsync(drug);

        return _drugMapper.MapToDto(drug);
    }

    [Authorize(DentifyPermissions.Drugs.Update)]
    public virtual async Task<DrugDto> UpdateAsync(Guid id, CreateUpdateDrugDto input)
    {
        var drug = await _drugRepository.GetAsync(id);

        drug.SetName(input.Name);
        drug.SetDefaultDosage(input.DefaultDosage);

        await _drugRepository.UpdateAsync(drug);

        return _drugMapper.MapToDto(drug);
    }

    [Authorize(DentifyPermissions.Drugs.Update)]
    public virtual async Task DeactivateAsync(Guid id)
    {
        var drug = await _drugRepository.GetAsync(id);
        drug.Deactivate();
        await _drugRepository.UpdateAsync(drug);
    }

    [Authorize(DentifyPermissions.Drugs.Update)]
    public virtual async Task ActivateAsync(Guid id)
    {
        var drug = await _drugRepository.GetAsync(id);
        drug.Activate();
        await _drugRepository.UpdateAsync(drug);
    }

    [Authorize(DentifyPermissions.Drugs.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _drugRepository.DeleteAsync(id);
    }
}
