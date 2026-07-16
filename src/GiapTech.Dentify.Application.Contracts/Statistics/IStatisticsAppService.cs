using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Statistics;

public interface IStatisticsAppService : IApplicationService
{
    Task<RevenueOverviewDto> GetRevenueOverviewAsync(DateTime fromDate, DateTime toDate);

    Task<List<ServiceStatisticDto>> GetServiceStatisticsAsync(DateTime fromDate, DateTime toDate);

    Task<List<DoctorStatisticDto>> GetDoctorStatisticsAsync(DateTime fromDate, DateTime toDate);
}
