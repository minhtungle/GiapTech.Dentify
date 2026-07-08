using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;
using Volo.Abp.Content;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public interface IConsentFormAppService : IApplicationService
{
    Task<List<ConsentFormDto>> GetListAsync(Guid appointmentId);

    Task<ConsentFormDto> UploadAsync(Guid appointmentId, UploadConsentFormInput input);

    Task<IRemoteStreamContent> DownloadAsync(Guid id);

    Task DeleteAsync(Guid id);
}
