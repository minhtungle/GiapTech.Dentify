using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;
using Volo.Abp.Content;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public interface IAppointmentPhotoAppService : IApplicationService
{
    Task<List<AppointmentPhotoDto>> GetListAsync(Guid appointmentId);

    Task<AppointmentPhotoDto> UploadAsync(Guid appointmentId, IRemoteStreamContent file);

    Task<IRemoteStreamContent> DownloadAsync(Guid id);

    Task DeleteAsync(Guid id);
}
