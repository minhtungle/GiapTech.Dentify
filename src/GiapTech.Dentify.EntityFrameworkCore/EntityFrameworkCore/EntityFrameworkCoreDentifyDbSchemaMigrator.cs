using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using GiapTech.Dentify.Data;
using Volo.Abp.DependencyInjection;

namespace GiapTech.Dentify.EntityFrameworkCore;

public class EntityFrameworkCoreDentifyDbSchemaMigrator
    : IDentifyDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreDentifyDbSchemaMigrator(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolving the DentifyDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<DentifyDbContext>()
            .Database
            .MigrateAsync();
    }
}
