using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace GiapTech.Dentify.Data;

/* This is used if database provider does't define
 * IDentifyDbSchemaMigrator implementation.
 */
public class NullDentifyDbSchemaMigrator : IDentifyDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
