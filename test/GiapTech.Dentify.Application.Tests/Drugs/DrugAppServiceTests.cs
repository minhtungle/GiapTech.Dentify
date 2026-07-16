using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Drugs;
using Shouldly;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Drugs;

public abstract class DrugAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IDrugAppService _drugAppService;

    protected DrugAppServiceTests()
    {
        _drugAppService = GetRequiredService<IDrugAppService>();
    }

    [Fact]
    public async Task Should_Create_Drug()
    {
        var result = await _drugAppService.CreateAsync(new CreateUpdateDrugDto
        {
            Name = "Amoxicillin",
            DefaultDosage = "500mg"
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.Name.ShouldBe("Amoxicillin");
        result.DefaultDosage.ShouldBe("500mg");
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Update_Drug()
    {
        var drug = await _drugAppService.CreateAsync(new CreateUpdateDrugDto { Name = "Paracetamol", DefaultDosage = "500mg" });

        var updated = await _drugAppService.UpdateAsync(drug.Id, new CreateUpdateDrugDto { Name = "Paracetamol", DefaultDosage = "650mg" });

        updated.DefaultDosage.ShouldBe("650mg");
    }

    [Fact]
    public async Task Should_Only_List_Active_Drugs()
    {
        var active = await _drugAppService.CreateAsync(new CreateUpdateDrugDto { Name = "Thuốc đang dùng" });
        var inactive = await _drugAppService.CreateAsync(new CreateUpdateDrugDto { Name = "Thuốc ngừng dùng" });
        await _drugAppService.DeactivateAsync(inactive.Id);

        var result = await _drugAppService.GetActiveListAsync();

        result.ShouldContain(x => x.Id == active.Id);
        result.ShouldNotContain(x => x.Id == inactive.Id);
    }

    [Fact]
    public async Task Should_Reactivate_Drug()
    {
        var drug = await _drugAppService.CreateAsync(new CreateUpdateDrugDto { Name = "Ibuprofen" });

        await _drugAppService.DeactivateAsync(drug.Id);
        await _drugAppService.ActivateAsync(drug.Id);

        var result = await _drugAppService.GetAsync(drug.Id);
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Delete_Drug()
    {
        var drug = await _drugAppService.CreateAsync(new CreateUpdateDrugDto { Name = "Thuốc sẽ xoá" });

        await _drugAppService.DeleteAsync(drug.Id);

        await Should.ThrowAsync<Exception>(async () => await _drugAppService.GetAsync(drug.Id));
    }
}
