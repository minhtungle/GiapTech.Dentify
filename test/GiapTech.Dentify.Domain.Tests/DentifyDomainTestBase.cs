using Volo.Abp.Modularity;

namespace GiapTech.Dentify;

/* Inherit from this class for your domain layer tests. */
public abstract class DentifyDomainTestBase<TStartupModule> : DentifyTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
