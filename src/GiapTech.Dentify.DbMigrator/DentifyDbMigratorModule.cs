using GiapTech.Dentify.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace GiapTech.Dentify.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(DentifyEntityFrameworkCoreModule),
    typeof(DentifyApplicationModule)
)]
public class DentifyDbMigratorModule : AbpModule
{
}
