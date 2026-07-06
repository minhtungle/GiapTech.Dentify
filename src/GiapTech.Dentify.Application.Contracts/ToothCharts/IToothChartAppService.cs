using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.ToothCharts;

public interface IToothChartAppService : IApplicationService
{
    /// <param name="id">The patient's id (a patient's tooth chart is 1-1, created lazily on first access).</param>
    Task<ToothChartDto> GetAsync(Guid id);

    Task<ToothRecordDto> UpdateStatusAsync(Guid patientId, int toothNumber, UpdateToothStatusDto input);

    Task<List<ToothRecordHistoryDto>> GetHistoryAsync(Guid patientId, int toothNumber);
}
