using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public interface IPatientAppService : IApplicationService
{
    Task<PatientDto> GetAsync(Guid id);

    Task<PagedResultDto<PatientDto>> GetListAsync(GetPatientListDto input);

    Task<PatientDto> CreateAsync(CreateUpdatePatientDto input);

    Task<PatientDto> UpdateAsync(Guid id, CreateUpdatePatientDto input);

    Task DeleteAsync(Guid id);

    Task<PatientDetailDto> GetPatientDetailAsync(Guid id);

    Task<List<RecallPatientDto>> GetRecallListAsync(int monthsThreshold);

    Task<PatientDto> LinkIdentityUserAsync(Guid id, LinkPatientIdentityUserDto input);

    Task<PatientDto> UnlinkIdentityUserAsync(Guid id);
}
