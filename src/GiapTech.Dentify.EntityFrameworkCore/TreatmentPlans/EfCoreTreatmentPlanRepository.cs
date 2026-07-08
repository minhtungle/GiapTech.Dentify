using System;
using System.Threading;
using System.Threading.Tasks;
using GiapTech.Dentify.TreatmentPlans;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace GiapTech.Dentify.EntityFrameworkCore.TreatmentPlans;

public class EfCoreTreatmentPlanRepository : EfCoreRepository<DentifyDbContext, TreatmentPlan, Guid>, ITreatmentPlanRepository
{
    public EfCoreTreatmentPlanRepository(IDbContextProvider<DentifyDbContext> dbContextProvider)
        : base(dbContextProvider)
    {
    }

    public async Task<TreatmentPlan> GetWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();

        var plan = await dbSet
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id, GetCancellationToken(cancellationToken));

        return plan ?? throw new EntityNotFoundException(typeof(TreatmentPlan), id);
    }
}
