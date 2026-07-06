using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.ToothCharts;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.BlobStoring.Database.EntityFrameworkCore;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore.Modeling;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.TenantManagement;
using Volo.Abp.TenantManagement.EntityFrameworkCore;

namespace GiapTech.Dentify.EntityFrameworkCore;

[ReplaceDbContext(typeof(IIdentityDbContext))]
[ReplaceDbContext(typeof(ITenantManagementDbContext))]
[ConnectionStringName("Default")]
public class DentifyDbContext :
    AbpDbContext<DentifyDbContext>,
    ITenantManagementDbContext,
    IIdentityDbContext
{
    /* Add DbSet properties for your Aggregate Roots / Entities here. */

    public DbSet<Patient> Patients { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<ToothChart> ToothCharts { get; set; }
    public DbSet<ToothRecordHistory> ToothRecordHistories { get; set; }
    public DbSet<AppointmentPhoto> AppointmentPhotos { get; set; }


    #region Entities from the modules

    /* Notice: We only implemented IIdentityProDbContext and ISaasDbContext
     * and replaced them for this DbContext. This allows you to perform JOIN
     * queries for the entities of these modules over the repositories easily. You
     * typically don't need that for other modules. But, if you need, you can
     * implement the DbContext interface of the needed module and use ReplaceDbContext
     * attribute just like IIdentityProDbContext and ISaasDbContext.
     *
     * More info: Replacing a DbContext of a module ensures that the related module
     * uses this DbContext on runtime. Otherwise, it will use its own DbContext class.
     */

    // Identity
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }

    // Tenant Management
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<TenantConnectionString> TenantConnectionStrings { get; set; }

    #endregion

    public DentifyDbContext(DbContextOptions<DentifyDbContext> options)
        : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        /* Include modules to your migration db context */

        builder.ConfigurePermissionManagement();
        builder.ConfigureSettingManagement();
        builder.ConfigureBackgroundJobs();
        builder.ConfigureAuditLogging();
        builder.ConfigureFeatureManagement();
        builder.ConfigureIdentity();
        builder.ConfigureOpenIddict();
        builder.ConfigureTenantManagement();
        builder.ConfigureBlobStoring();

        /* Configure your own tables/entities inside here */

        builder.Entity<Patient>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Patients", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.FullName).IsRequired().HasMaxLength(PatientConsts.MaxFullNameLength);
            b.Property(x => x.PhoneNumber).HasMaxLength(PatientConsts.MaxPhoneNumberLength);
            b.Property(x => x.Email).HasMaxLength(PatientConsts.MaxEmailLength);
            b.Property(x => x.Address).HasMaxLength(PatientConsts.MaxAddressLength);
            b.Property(x => x.Notes).HasMaxLength(PatientConsts.MaxNotesLength);
            b.Property(x => x.Tags)
                .HasConversion(
                    tags => JsonSerializer.Serialize(tags, (JsonSerializerOptions?)null),
                    json => JsonSerializer.Deserialize<List<string>>(json, (JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (a, b2) => (a ?? new List<string>()).SequenceEqual(b2 ?? new List<string>()),
                    a => a.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
                    a => a.ToList()));

            b.Ignore(x => x.IsChildPatient);

            b.HasIndex(x => x.FullName);
            b.HasIndex(x => x.PhoneNumber);
        });

        builder.Entity<Appointment>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Appointments", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.PreOpNotes).HasMaxLength(AppointmentConsts.MaxNotesLength);
            b.Property(x => x.PostOpNotes).HasMaxLength(AppointmentConsts.MaxNotesLength);
            b.Property(x => x.Prescription).HasMaxLength(AppointmentConsts.MaxPrescriptionLength);
            b.Property(x => x.Price).HasColumnType("decimal(18,2)");
            b.Property(x => x.PaidAmount).HasColumnType("decimal(18,2)");

            b.HasOne<Patient>().WithMany().HasForeignKey(x => x.PatientId).IsRequired();

            b.HasIndex(x => x.PatientId);
            b.HasIndex(x => x.DoctorId);
            b.HasIndex(x => x.ScheduledDateTime);
        });

        builder.Entity<ToothChart>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "ToothCharts", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.HasOne<Patient>().WithOne().HasForeignKey<ToothChart>(x => x.PatientId).IsRequired();
            b.HasIndex(x => x.PatientId).IsUnique();

            b.HasMany(x => x.Records).WithOne().HasForeignKey(x => x.ToothChartId).IsRequired();
            b.Navigation(x => x.Records).HasField("_records").UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        builder.Entity<ToothRecord>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "ToothRecords", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Notes).HasMaxLength(ToothChartConsts.MaxNotesLength);

            b.HasIndex(x => new { x.ToothChartId, x.ToothNumber }).IsUnique();
        });

        builder.Entity<ToothRecordHistory>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "ToothRecordHistories", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Notes).HasMaxLength(ToothChartConsts.MaxNotesLength);

            b.HasOne<Patient>().WithMany().HasForeignKey(x => x.PatientId).IsRequired();
            b.HasOne<Appointment>().WithMany().HasForeignKey(x => x.AppointmentId).IsRequired(false);

            b.HasIndex(x => new { x.PatientId, x.ToothNumber });
        });

        builder.Entity<AppointmentPhoto>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "AppointmentPhotos", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.BlobName).IsRequired();
            b.Property(x => x.FileName).IsRequired().HasMaxLength(AppointmentPhotoConsts.MaxFileNameLength);
            b.Property(x => x.ContentType).IsRequired().HasMaxLength(AppointmentPhotoConsts.MaxContentTypeLength);

            b.HasOne<Appointment>().WithMany().HasForeignKey(x => x.AppointmentId).IsRequired();

            b.HasIndex(x => x.AppointmentId);
        });
    }
}
