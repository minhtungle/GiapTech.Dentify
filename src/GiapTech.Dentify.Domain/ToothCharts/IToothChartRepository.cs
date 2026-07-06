using System;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.ToothCharts;

public interface IToothChartRepository : IRepository<ToothChart, Guid>
{
    Task<ToothChart?> FindByPatientIdAsync(Guid patientId, CancellationToken cancellationToken = default);
}
