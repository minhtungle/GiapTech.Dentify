using System;
using System.Threading;
using System.Threading.Tasks;
using GiapTech.Dentify.Appointments;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace GiapTech.Dentify.EntityFrameworkCore.Appointments;

public class EfCoreAppointmentRepository : EfCoreRepository<DentifyDbContext, Appointment, Guid>, IAppointmentRepository
{
    public EfCoreAppointmentRepository(IDbContextProvider<DentifyDbContext> dbContextProvider)
        : base(dbContextProvider)
    {
    }

    public async Task<Appointment> GetWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var dbSet = await GetDbSetAsync();

        var appointment = await dbSet
            .Include(x => x.PrescriptionItems)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == id, GetCancellationToken(cancellationToken));

        return appointment ?? throw new EntityNotFoundException(typeof(Appointment), id);
    }
}
