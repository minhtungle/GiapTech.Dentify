using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public interface IAppointmentAppService : IApplicationService
{
    Task<AppointmentDto> GetAsync(Guid id);

    Task<PagedResultDto<AppointmentDto>> GetListAsync(GetAppointmentListDto input);

    Task<List<AppointmentDto>> GetCalendarViewAsync(DateTime fromDate, DateTime toDate);

    Task<AppointmentDto> CreateAsync(CreateUpdateAppointmentDto input);

    Task<AppointmentDto> UpdateAsync(Guid id, CreateUpdateAppointmentDto input);

    Task DeleteAsync(Guid id);

    Task<AppointmentDto> AddPaymentAsync(Guid id, CreatePaymentDto input);

    Task<AppointmentDto> RemovePaymentAsync(Guid id, Guid paymentId);
}
