using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using GiapTech.Dentify.Localization;
using GiapTech.Dentify.MultiTenancy;
using System;
using Volo.Abp.Localization;
using Volo.Abp.Modularity;
using Volo.Abp.MultiTenancy;
using Volo.Abp.PermissionManagement.Identity;
using Volo.Abp.SettingManagement;
using Volo.Abp.BlobStoring;
using Volo.Abp.BlobStoring.Database;
using Volo.Abp.Caching;
using GiapTech.Dentify.Appointments;
using Volo.Abp.OpenIddict;
using Volo.Abp.PermissionManagement.OpenIddict;
using Volo.Abp.AuditLogging;
using Volo.Abp.BackgroundJobs;
using Volo.Abp.BackgroundWorkers;
using Volo.Abp.Emailing;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.MailKit;
using GiapTech.Dentify.Settings;
using Volo.Abp.TenantManagement;

namespace GiapTech.Dentify;

[DependsOn(
    typeof(DentifyDomainSharedModule),
    typeof(AbpAuditLoggingDomainModule),
    typeof(AbpCachingModule),
    typeof(AbpBackgroundJobsDomainModule),
    typeof(AbpBackgroundWorkersModule),
    typeof(AbpFeatureManagementDomainModule),
    typeof(AbpPermissionManagementDomainIdentityModule),
    typeof(AbpPermissionManagementDomainOpenIddictModule),
    typeof(AbpSettingManagementDomainModule),
    typeof(AbpEmailingModule),
    typeof(AbpMailKitModule),
    typeof(AbpIdentityDomainModule),
    typeof(AbpOpenIddictDomainModule),
    typeof(AbpTenantManagementDomainModule),
    typeof(BlobStoringDatabaseDomainModule)
    )]
public class DentifyDomainModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpMultiTenancyOptions>(options =>
        {
            options.IsEnabled = MultiTenancyConsts.IsEnabled;
        });

        Configure<AbpBlobStoringOptions>(options =>
        {
            options.Containers.Configure<AppointmentPhotoContainer>(container =>
            {
                container.UseDatabase();
            });

            options.Containers.Configure<ConsentFormContainer>(container =>
            {
                container.UseDatabase();
            });

            options.Containers.Configure<ClinicLogoContainer>(container =>
            {
                container.UseDatabase();
            });
        });

        // Real SMTP sending only kicks in once Settings:Abp.Mailing.Smtp.Host is
        // configured (appsettings.secrets.json, gitignored) — otherwise fall back to a
        // no-op sender so a missing/placeholder SMTP config never crashes the app, it
        // just silently skips sending instead.
        var smtpHost = context.Services.GetConfiguration()["Settings:Abp.Mailing.Smtp.Host"];
        if (string.IsNullOrWhiteSpace(smtpHost))
        {
            context.Services.Replace(ServiceDescriptor.Singleton<IEmailSender, NullEmailSender>());
        }
    }
}
