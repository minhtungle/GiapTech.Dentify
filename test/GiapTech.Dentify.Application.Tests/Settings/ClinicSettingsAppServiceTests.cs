using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Settings;
using Shouldly;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Settings;

public abstract class ClinicSettingsAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IClinicSettingsAppService _clinicSettingsAppService;

    protected ClinicSettingsAppServiceTests()
    {
        _clinicSettingsAppService = GetRequiredService<IClinicSettingsAppService>();
    }

    [Fact]
    public async Task Should_Get_Default_Settings()
    {
        var settings = await _clinicSettingsAppService.GetAsync();

        settings.Name.ShouldBe("Dentify");
        settings.Address.ShouldBeNullOrEmpty();
    }

    [Fact]
    public async Task Should_Update_And_Get_Settings()
    {
        await _clinicSettingsAppService.UpdateAsync(new UpdateClinicSettingsDto
        {
            Name = "Nha Khoa ABC",
            Address = "123 Đường XYZ, Quận 1",
            PhoneNumber = "0901234567",
            LogoUrl = "https://example.com/logo.png"
        });

        var settings = await _clinicSettingsAppService.GetAsync();

        settings.Name.ShouldBe("Nha Khoa ABC");
        settings.Address.ShouldBe("123 Đường XYZ, Quận 1");
        settings.PhoneNumber.ShouldBe("0901234567");
        settings.LogoUrl.ShouldBe("https://example.com/logo.png");
    }
}
