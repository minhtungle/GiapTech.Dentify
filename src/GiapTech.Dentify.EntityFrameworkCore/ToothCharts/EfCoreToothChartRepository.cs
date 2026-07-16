using System;
using System.Threading;
using System.Threading.Tasks;
using GiapTech.Dentify.ToothCharts;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace GiapTech.Dentify.EntityFrameworkCore.ToothCharts;

public class EfCoreToothChartRepository : EfCoreRepository<DentifyDbContext, ToothChart, Guid>, IToothChartRepository
{
    public EfCoreToothChartRepository(IDbContextProvider<DentifyDbContext> dbContextProvider)
        : base(dbContextProvider)
    {
    }

    public async Task<ToothChart?> FindByPatientIdAsync(Guid patientId, CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();

        return await dbSet
            .Include(x => x.Records)
            .FirstOrDefaultAsync(x => x.PatientId == patientId, GetCancellationToken(cancellationToken));
    }
}
