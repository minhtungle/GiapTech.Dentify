using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Settings;
using GiapTech.Dentify.Permissions;
using GiapTech.Dentify.Settings;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.SettingManagement;

namespace GiapTech.Dentify.Application.Settings;

[Authorize(DentifyPermissions.ClinicSettings.Default)]
public class ClinicSettingsAppService : ApplicationService, IClinicSettingsAppService
{
    private readonly ISettingManager _settingManager;

    public ClinicSettingsAppService(ISettingManager settingManager)
    {
        _settingManager = settingManager;
    }

    public virtual async Task<ClinicSettingsDto> GetAsync()
    {
        return new ClinicSettingsDto
        {
            Name = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.Name) ?? "Dentify",
            Address = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.Address),
            PhoneNumber = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.PhoneNumber),
            LogoUrl = await SettingProvider.GetOrNullAsync(DentifySettings.Clinic.LogoUrl)
        };
    }

    [Authorize(DentifyPermissions.ClinicSettings.Update)]
    public virtual async Task UpdateAsync(UpdateClinicSettingsDto input)
    {
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.Name, input.Name);
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.Address, input.Address ?? string.Empty);
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.PhoneNumber, input.PhoneNumber ?? string.Empty);
        await _settingManager.SetGlobalAsync(DentifySettings.Clinic.LogoUrl, input.LogoUrl ?? string.Empty);
    }
}
