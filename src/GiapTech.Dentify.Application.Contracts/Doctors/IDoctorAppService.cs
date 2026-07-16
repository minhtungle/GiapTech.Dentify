using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Doctors;

public interface IDoctorAppService : IApplicationService
{
    Task<DoctorDto> GetAsync(Guid id);

    Task<List<DoctorDto>> GetActiveListAsync();

    Task<DoctorDto> CreateAsync(CreateUpdateDoctorDto input);

    Task<DoctorDto> UpdateAsync(Guid id, CreateUpdateDoctorDto input);

    Task DeactivateAsync(Guid id);

    Task ActivateAsync(Guid id);

    Task DeleteAsync(Guid id);
}
