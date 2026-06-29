using System.Threading.Tasks;

namespace GiapTech.Dentify.Data;

public interface IDentifyDbSchemaMigrator
{
    Task MigrateAsync();
}
