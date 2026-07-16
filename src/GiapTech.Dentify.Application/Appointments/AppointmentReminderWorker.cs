using System.Threading.Tasks;
using GiapTech.Dentify.Appointments;
using Microsoft.Extensions.DependencyInjection;
using Volo.Abp.BackgroundWorkers;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Threading;

namespace GiapTech.Dentify.Application.Appointments;

public class AppointmentReminderWorker : AsyncPeriodicBackgroundWorkerBase, ITransientDependency
{
    public AppointmentReminderWorker(AbpAsyncTimer timer, IServiceScopeFactory serviceScopeFactory)
        : base(timer, serviceScopeFactory)
    {
        Timer.Period = AppointmentReminderConsts.WorkerPeriodMilliseconds;
    }

    protected override async Task DoWorkAsync(PeriodicBackgroundWorkerContext workerContext)
    {
        var reminderAppService = workerContext.ServiceProvider.GetRequiredService<AppointmentReminderAppService>();
        await reminderAppService.SendDueRemindersAsync();
    }
}
