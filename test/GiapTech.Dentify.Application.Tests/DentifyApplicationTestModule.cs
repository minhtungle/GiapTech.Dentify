using Volo.Abp.Modularity;

namespace GiapTech.Dentify;

[DependsOn(
    typeof(DentifyApplicationModule),
    typeof(DentifyDomainTestModule)
)]
public class DentifyApplicationTestModule : AbpModule
{

}
