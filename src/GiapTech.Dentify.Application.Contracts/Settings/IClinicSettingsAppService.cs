using System.Threading.Tasks;
using Volo.Abp.Application.Services;
using Volo.Abp.Content;

namespace GiapTech.Dentify.Application.Contracts.Settings;

public interface IClinicSettingsAppService : IApplicationService
{
    Task<ClinicSettingsDto> GetAsync();

    Task UpdateAsync(UpdateClinicSettingsDto input);

    Task<ClinicSettingsDto> UploadLogoAsync(IRemoteStreamContent file);

    Task<IRemoteStreamContent> DownloadLogoAsync();
}
