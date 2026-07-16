using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Supplies;
using Shouldly;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Supplies;

public abstract class SupplyAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly ISupplyAppService _supplyAppService;

    protected SupplyAppServiceTests()
    {
        _supplyAppService = GetRequiredService<ISupplyAppService>();
    }

    [Fact]
    public async Task Should_Create_Supply_With_Zero_Initial_Quantity()
    {
        var result = await _supplyAppService.CreateAsync(new CreateUpdateSupplyDto
        {
            Name = "Vật liệu trám Composite",
            Unit = "ống",
            LowStockThreshold = 5
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.Name.ShouldBe("Vật liệu trám Composite");
        result.Unit.ShouldBe("ống");
        result.Quantity.ShouldBe(0);
        result.LowStockThreshold.ShouldBe(5);
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Update_Supply()
    {
        var supply = await _supplyAppService.CreateAsync(new CreateUpdateSupplyDto { Name = "Găng tay y tế", Unit = "hộp" });

        var updated = await _supplyAppService.UpdateAsync(supply.Id, new CreateUpdateSupplyDto
        {
            Name = "Găng tay y tế cao cấp",
            Unit = "hộp",
            LowStockThreshold = 10
        });

        updated.Name.ShouldBe("Găng tay y tế cao cấp");
        updated.LowStockThreshold.ShouldBe(10);
    }

    [Fact]
    public async Task Should_Restock_Supply_And_Increase_Quantity()
    {
        var supply = await _supplyAppService.CreateAsync(new CreateUpdateSupplyDto { Name = "Thuốc tê Lidocaine", Unit = "ống" });

        var restocked = await _supplyAppService.RestockAsync(supply.Id, new RestockSupplyDto { Quantity = 50 });
        restocked.Quantity.ShouldBe(50);

        var restockedAgain = await _supplyAppService.RestockAsync(supply.Id, new RestockSupplyDto { Quantity = 20 });
        restockedAgain.Quantity.ShouldBe(70);
    }

    [Fact]
    public async Task Should_Only_List_Active_Supplies()
    {
        var active = await _supplyAppService.CreateAsync(new CreateUpdateSupplyDto { Name = "Vật tư đang dùng", Unit = "cái" });
        var inactive = await _supplyAppService.CreateAsync(new CreateUpdateSupplyDto { Name = "Vật tư ngừng dùng", Unit = "cái" });
        await _supplyAppService.DeactivateAsync(inactive.Id);

        var result = await _supplyAppService.GetActiveListAsync();

        result.ShouldContain(x => x.Id == active.Id);
        result.ShouldNotContain(x => x.Id == inactive.Id);
    }

    [Fact]
    public async Task Should_Reactivate_Supply()
    {
        var supply = await _supplyAppService.CreateAsync(new CreateUpdateSupplyDto { Name = "Chỉ khâu nha khoa", Unit = "cuộn" });

        await _supplyAppService.DeactivateAsync(supply.Id);
        await _supplyAppService.ActivateAsync(supply.Id);

        var result = await _supplyAppService.GetAsync(supply.Id);
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Delete_Supply()
    {
        var supply = await _supplyAppService.CreateAsync(new CreateUpdateSupplyDto { Name = "Vật tư sẽ xoá", Unit = "cái" });

        await _supplyAppService.DeleteAsync(supply.Id);

        await Should.ThrowAsync<Exception>(async () => await _supplyAppService.GetAsync(supply.Id));
    }
}
