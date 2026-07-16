using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Settings;
using GiapTech.Dentify.Permissions;
using GiapTech.Dentify.Settings;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Content;
using Volo.Abp.SettingManagement;

namespace GiapTech.Dentify.Application.Settings;

[Authorize(DentifyPermissions.ClinicSettings.Default)]
public class ClinicSettingsAppService : ApplicationService, IClinicSettingsAppService
{
    private readonly ISettingManager _settingManager;
    private readonly IBlobContainer<ClinicLogoContainer> _logoBlobContainer;

    public ClinicSettingsAppService(
        ISettingManager settingManager,
        IBlobContainer<ClinicLogoContainer> logoBlobContainer)
    {
        _settingManager = settingManager;
        _logoBlobContainer = logoBlobContainer;
    }

    public virtual async Task<ClinicSettingsDto> GetAsync()
    {
        return await BuildDtoAsync();
    }

    [Authorize(DentifyPermissions.ClinicSettings.Update)]
    public virtual async Task UpdateAsync(UpdateClinicSettingsDto input)
    {
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.Name, input.Name);
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.Address, input.Address ?? string.Empty);
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.PhoneNumber, input.PhoneNumber ?? string.Empty);
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.LogoUrl, input.LogoUrl ?? string.Empty);
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.ToothNotationSystem, input.ToothNotationSystem);
    }

    [Authorize(DentifyPermissions.ClinicSettings.Update)]
    public virtual async Task<ClinicSettingsDto> UploadLogoAsync(IRemoteStreamContent file)
    {
        var contentType = file.ContentType ?? "application/octet-stream";
        if (!ClinicLogoConsts.AllowedContentTypes.Contains(contentType))
        {
            throw new BusinessException(DentifyDomainErrorCodes.UnsupportedLogoContentType);
        }

        await using var memoryStream = new MemoryStream();
        await file.GetStream().CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();

        if (bytes.LongLength > ClinicLogoConsts.MaxSizeBytes)
        {
            throw new BusinessException(DentifyDomainErrorCodes.LogoSizeTooLarge);
        }

        await _logoBlobContainer.SaveAsync(ClinicLogoConsts.BlobName, bytes, overrideExisting: true);
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.HasUploadedLogo, "true");

        return await BuildDtoAsync();
    }

    public virtual async Task<IRemoteStreamContent> DownloadLogoAsync()
    {
        var stream = await _logoBlobContainer.GetAsync(ClinicLogoConsts.BlobName);
        return new RemoteStreamContent(stream, ClinicLogoConsts.BlobName);
    }

    private async Task<ClinicSettingsDto> BuildDtoAsync()
    {
        var hasUploadedLogo = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.HasUploadedLogo);

        return new ClinicSettingsDto
        {
            Name = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.Name) ?? "Dentify",
            Address = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.Address),
            PhoneNumber = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.PhoneNumber),
            LogoUrl = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.LogoUrl),
            HasUploadedLogo = string.Equals(hasUploadedLogo, "true", StringComparison.OrdinalIgnoreCase),
            ToothNotationSystem = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.ToothNotationSystem) ?? "Iso3950"
        };
    }
}
