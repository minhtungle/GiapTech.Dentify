using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.PatientPortal;

public interface IPatientPortalAppService : IApplicationService
{
    Task<PatientPortalProfileDto> GetMyProfileAsync();

    Task<List<PatientPortalAppointmentDto>> GetMyAppointmentsAsync(bool upcoming);

    Task<List<PatientPortalAppointmentDto>> GetMyTreatmentHistoryAsync();

    Task<PatientPortalBalanceDto> GetMyBalanceAsync();
}
