using GiapTech.Dentify.Application.Appointments;
using GiapTech.Dentify.Application.Chairs;
using GiapTech.Dentify.Application.Doctors;
using GiapTech.Dentify.Application.Drugs;
using GiapTech.Dentify.Application.Expenses;
using GiapTech.Dentify.Application.LabWorks;
using GiapTech.Dentify.Application.Patients;
using GiapTech.Dentify.Application.Services;
using GiapTech.Dentify.Application.Supplies;
using GiapTech.Dentify.Application.Tasks;
using GiapTech.Dentify.Application.TreatmentPlans;
using GiapTech.Dentify.Application.Waitlist;
using Volo.Abp.PermissionManagement;
using Volo.Abp.SettingManagement;
using Volo.Abp.Account;
using Volo.Abp.Identity;
using Volo.Abp.Mapperly;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Modularity;
using Microsoft.Extensions.DependencyInjection;
using Volo.Abp.TenantManagement;

namespace GiapTech.Dentify;

[DependsOn(
    typeof(DentifyDomainModule),
    typeof(DentifyApplicationContractsModule),
    typeof(AbpPermissionManagementApplicationModule),
    typeof(AbpFeatureManagementApplicationModule),
    typeof(AbpIdentityApplicationModule),
    typeof(AbpAccountApplicationModule),
    typeof(AbpTenantManagementApplicationModule),
    typeof(AbpSettingManagementApplicationModule)
    )]
public class DentifyApplicationModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        context.Services.AddSingleton<PatientMapper>();
        context.Services.AddSingleton<DoctorMapper>();
        context.Services.AddSingleton<ServiceMapper>();
        context.Services.AddSingleton<DrugMapper>();
        context.Services.AddSingleton<ChairMapper>();
        context.Services.AddSingleton<WaitlistEntryMapper>();
        context.Services.AddSingleton<AppointmentMapper>();
        context.Services.AddSingleton<LabWorkMapper>();
        context.Services.AddSingleton<ExpenseMapper>();
        context.Services.AddSingleton<TaskItemMapper>();
        context.Services.AddSingleton<TreatmentPlanMapper>();
        context.Services.AddSingleton<SupplyMapper>();
        context.Services.AddSingleton<InsurancePolicyMapper>();
    }
}
