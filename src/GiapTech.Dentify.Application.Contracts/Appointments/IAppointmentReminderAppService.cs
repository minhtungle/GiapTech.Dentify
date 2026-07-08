using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public interface IAppointmentReminderAppService : IApplicationService
{
    Task<int> SendDueRemindersAsync();
}
