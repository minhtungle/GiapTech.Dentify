using Volo.Abp.Modularity;

namespace GiapTech.Dentify;

[DependsOn(
    typeof(DentifyDomainModule),
    typeof(DentifyTestBaseModule)
)]
public class DentifyDomainTestModule : AbpModule
{

}
