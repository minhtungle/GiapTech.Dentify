using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Settings;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Content;
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

    private static RemoteStreamContent CreateFakeImage(string contentType = "image/png")
    {
        var bytes = Encoding.UTF8.GetBytes("fake-logo-bytes");
        return new RemoteStreamContent(new MemoryStream(bytes), "logo.png", contentType);
    }

    [Fact]
    public async Task Should_Get_Default_Settings()
    {
        var settings = await _clinicSettingsAppService.GetAsync();

        settings.Name.ShouldBe("Dentify");
        settings.Address.ShouldBeNullOrEmpty();
        settings.ToothNotationSystem.ShouldBe("Iso3950");
    }

    [Fact]
    public async Task Should_Update_And_Get_Settings()
    {
        await _clinicSettingsAppService.UpdateAsync(new UpdateClinicSettingsDto
        {
            Name = "Nha Khoa ABC",
            Address = "123 Đường XYZ, Quận 1",
            PhoneNumber = "0901234567",
            LogoUrl = "https://example.com/logo.png",
            ToothNotationSystem = "Palmer"
        });

        var settings = await _clinicSettingsAppService.GetAsync();

        settings.Name.ShouldBe("Nha Khoa ABC");
        settings.Address.ShouldBe("123 Đường XYZ, Quận 1");
        settings.PhoneNumber.ShouldBe("0901234567");
        settings.LogoUrl.ShouldBe("https://example.com/logo.png");
        settings.ToothNotationSystem.ShouldBe("Palmer");
    }

    [Fact]
    public async Task Should_Upload_And_Download_Logo()
    {
        var result = await _clinicSettingsAppService.UploadLogoAsync(CreateFakeImage());

        result.HasUploadedLogo.ShouldBeTrue();

        var downloaded = await _clinicSettingsAppService.DownloadLogoAsync();

        using var reader = new StreamReader(downloaded.GetStream());
        var content = await reader.ReadToEndAsync();
        content.ShouldBe("fake-logo-bytes");
    }

    [Fact]
    public async Task Should_Throw_BusinessException_For_Unsupported_Logo_ContentType()
    {
        var exception = await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _clinicSettingsAppService.UploadLogoAsync(CreateFakeImage("application/x-msdownload"));
        });

        exception.Code.ShouldBe(DentifyDomainErrorCodes.UnsupportedLogoContentType);
    }

    [Fact]
    public async Task Should_Throw_When_Downloading_Logo_That_Was_Never_Uploaded()
    {
        await Should.ThrowAsync<Exception>(async () =>
        {
            await _clinicSettingsAppService.DownloadLogoAsync();
        });
    }

    [Fact]
    public async Task Should_Overwrite_Logo_On_Repeated_Upload()
    {
        await _clinicSettingsAppService.UploadLogoAsync(CreateFakeImage());

        var bytes = Encoding.UTF8.GetBytes("second-logo-bytes");
        var secondUpload = new RemoteStreamContent(new MemoryStream(bytes), "logo2.png", "image/png");
        await _clinicSettingsAppService.UploadLogoAsync(secondUpload);

        var downloaded = await _clinicSettingsAppService.DownloadLogoAsync();
        using var reader = new StreamReader(downloaded.GetStream());
        var content = await reader.ReadToEndAsync();
        content.ShouldBe("second-logo-bytes");
    }
}
