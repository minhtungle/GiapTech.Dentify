using System;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.TreatmentPlans;

public interface ITreatmentPlanRepository : IRepository<TreatmentPlan, Guid>
{
    Task<TreatmentPlan> GetWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
