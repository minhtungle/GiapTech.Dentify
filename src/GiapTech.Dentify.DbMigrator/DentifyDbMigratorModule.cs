using GiapTech.Dentify.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace GiapTech.Dentify.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(DentifyEntityFrameworkCoreModule),
    typeof(DentifyApplicationContractsModule)
)]
public class DentifyDbMigratorModule : AbpModule
{
}
