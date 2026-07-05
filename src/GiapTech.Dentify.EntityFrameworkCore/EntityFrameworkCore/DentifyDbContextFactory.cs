using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace GiapTech.Dentify.EntityFrameworkCore;

/* This class is needed for EF Core console commands
 * (like Add-Migration and Update-Database commands) */
public class DentifyDbContextFactory : IDesignTimeDbContextFactory<DentifyDbContext>
{
    public DentifyDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();
        
        DentifyEfCoreEntityExtensionMappings.Configure();

        var builder = new DbContextOptionsBuilder<DentifyDbContext>()
            .UseNpgsql(configuration.GetConnectionString("Default"));
        
        return new DentifyDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../GiapTech.Dentify.DbMigrator/"))
            .AddJsonFile("appsettings.json", optional: false)
            .AddEnvironmentVariables();

        return builder.Build();
    }
}
