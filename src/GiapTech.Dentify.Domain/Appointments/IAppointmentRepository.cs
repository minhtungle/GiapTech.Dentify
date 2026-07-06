using System;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Appointments;

public interface IAppointmentRepository : IRepository<Appointment, Guid>
{
    Task<Appointment> GetWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
