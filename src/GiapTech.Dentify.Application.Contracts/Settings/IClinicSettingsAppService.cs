using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Settings;

public interface IClinicSettingsAppService : IApplicationService
{
    Task<ClinicSettingsDto> GetAsync();

    Task UpdateAsync(UpdateClinicSettingsDto input);
}
