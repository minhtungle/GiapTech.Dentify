using Volo.Abp.Modularity;

namespace GiapTech.Dentify;

public abstract class DentifyApplicationTestBase<TStartupModule> : DentifyTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
