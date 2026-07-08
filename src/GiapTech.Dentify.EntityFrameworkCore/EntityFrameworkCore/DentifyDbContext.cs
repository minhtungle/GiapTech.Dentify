using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Chairs;
using GiapTech.Dentify.Doctors;
using GiapTech.Dentify.Drugs;
using GiapTech.Dentify.Expenses;
using GiapTech.Dentify.LabWorks;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Services;
using GiapTech.Dentify.Supplies;
using GiapTech.Dentify.Tasks;
using GiapTech.Dentify.ToothCharts;
using GiapTech.Dentify.TreatmentPlans;
using GiapTech.Dentify.Waitlist;
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
    public DbSet<Doctor> Doctors { get; set; }
    public DbSet<Service> Services { get; set; }
    public DbSet<Drug> Drugs { get; set; }
    public DbSet<Chair> Chairs { get; set; }
    public DbSet<WaitlistEntry> WaitlistEntries { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<ToothChart> ToothCharts { get; set; }
    public DbSet<ToothRecordHistory> ToothRecordHistories { get; set; }
    public DbSet<AppointmentPhoto> AppointmentPhotos { get; set; }
    public DbSet<PrescriptionItem> PrescriptionItems { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<LabWork> LabWorks { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<TaskItem> TaskItems { get; set; }
    public DbSet<TreatmentPlan> TreatmentPlans { get; set; }
    public DbSet<TreatmentPlanItem> TreatmentPlanItems { get; set; }
    public DbSet<ConsentForm> ConsentForms { get; set; }
    public DbSet<Supply> Supplies { get; set; }
    public DbSet<SupplyUsage> SupplyUsages { get; set; }
    public DbSet<InsurancePolicy> InsurancePolicies { get; set; }


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
            b.Property(x => x.ReferralSource).HasMaxLength(PatientConsts.MaxReferralSourceLength);
            b.Property(x => x.Tags)
                .HasConversion(
                    tags => JsonSerializer.Serialize(tags, (JsonSerializerOptions?)null),
                    json => JsonSerializer.Deserialize<List<string>>(json, (JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (a, b2) => (a ?? new List<string>()).SequenceEqual(b2 ?? new List<string>()),
                    a => a.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
                    a => a.ToList()));

            b.Property(x => x.Allergies)
                .HasConversion(
                    allergies => JsonSerializer.Serialize(allergies, (JsonSerializerOptions?)null),
                    json => JsonSerializer.Deserialize<List<string>>(json, (JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (a, b2) => (a ?? new List<string>()).SequenceEqual(b2 ?? new List<string>()),
                    a => a.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
                    a => a.ToList()));

            b.Property(x => x.MedicalConditions)
                .HasConversion(
                    conditions => JsonSerializer.Serialize(conditions, (JsonSerializerOptions?)null),
                    json => JsonSerializer.Deserialize<List<string>>(json, (JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (a, b2) => (a ?? new List<string>()).SequenceEqual(b2 ?? new List<string>()),
                    a => a.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
                    a => a.ToList()));

            b.Ignore(x => x.IsChildPatient);

            b.HasIndex(x => x.FullName);
            b.HasIndex(x => x.PhoneNumber);
            b.HasIndex(x => x.IdentityUserId).IsUnique().HasFilter("\"IdentityUserId\" IS NOT NULL");
        });

        builder.Entity<Appointment>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Appointments", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.PreOpNotes).HasMaxLength(AppointmentConsts.MaxNotesLength);
            b.Property(x => x.PostOpNotes).HasMaxLength(AppointmentConsts.MaxNotesLength);
            b.Property(x => x.Price).HasColumnType("decimal(18,2)");
            b.Property(x => x.PaidAmount).HasColumnType("decimal(18,2)");

            b.HasOne<Patient>().WithMany().HasForeignKey(x => x.PatientId).IsRequired();
            b.HasOne<Doctor>().WithMany().HasForeignKey(x => x.DoctorId).IsRequired(false);
            b.HasOne<Service>().WithMany().HasForeignKey(x => x.ServiceId).IsRequired(false);
            b.HasOne<Chair>().WithMany().HasForeignKey(x => x.ChairId).IsRequired(false);

            b.HasMany(x => x.PrescriptionItems).WithOne().HasForeignKey(x => x.AppointmentId).IsRequired();
            b.Navigation(x => x.PrescriptionItems).HasField("_prescriptionItems").UsePropertyAccessMode(PropertyAccessMode.Field);

            b.HasMany(x => x.Payments).WithOne().HasForeignKey(x => x.AppointmentId).IsRequired();
            b.Navigation(x => x.Payments).HasField("_payments").UsePropertyAccessMode(PropertyAccessMode.Field);

            b.HasIndex(x => x.PatientId);
            b.HasIndex(x => x.DoctorId);
            b.HasIndex(x => x.ServiceId);
            b.HasIndex(x => x.ChairId);
            b.HasIndex(x => x.ScheduledDateTime);
        });

        builder.Entity<Doctor>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Doctors", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Specialization).HasMaxLength(DoctorConsts.MaxSpecializationLength);

            b.HasIndex(x => x.IdentityUserId).IsUnique();
        });

        builder.Entity<Service>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Services", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Name).IsRequired().HasMaxLength(ServiceConsts.MaxNameLength);
            b.Property(x => x.Price).HasColumnType("decimal(18,2)");
        });

        builder.Entity<Drug>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Drugs", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Name).IsRequired().HasMaxLength(DrugConsts.MaxNameLength);
            b.Property(x => x.DefaultDosage).HasMaxLength(DrugConsts.MaxDefaultDosageLength);
        });

        builder.Entity<Chair>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Chairs", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Name).IsRequired().HasMaxLength(ChairConsts.MaxNameLength);
        });

        builder.Entity<WaitlistEntry>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "WaitlistEntries", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.PreferredTimeNote).HasMaxLength(WaitlistEntryConsts.MaxPreferredTimeNoteLength);
            b.Property(x => x.Notes).HasMaxLength(WaitlistEntryConsts.MaxNotesLength);

            b.HasOne<Patient>().WithMany().HasForeignKey(x => x.PatientId).IsRequired();
            b.HasOne<Doctor>().WithMany().HasForeignKey(x => x.DoctorId).IsRequired(false);
            b.HasOne<Service>().WithMany().HasForeignKey(x => x.ServiceId).IsRequired(false);

            b.HasIndex(x => x.PatientId);
            b.HasIndex(x => x.Status);
        });

        builder.Entity<PrescriptionItem>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "PrescriptionItems", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.DrugName).IsRequired().HasMaxLength(PrescriptionItemConsts.MaxDrugNameLength);
            b.Property(x => x.Dosage).HasMaxLength(PrescriptionItemConsts.MaxDosageLength);
            b.Property(x => x.Instructions).HasMaxLength(PrescriptionItemConsts.MaxInstructionsLength);

            b.HasOne<Drug>().WithMany().HasForeignKey(x => x.DrugId).IsRequired(false);

            b.HasIndex(x => x.AppointmentId);
            b.HasIndex(x => x.DrugId);
        });

        builder.Entity<Payment>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Payments", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Amount).HasColumnType("decimal(18,2)");
            b.Property(x => x.Notes).HasMaxLength(PaymentConsts.MaxNotesLength);

            b.HasIndex(x => x.AppointmentId);
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
            b.Property(x => x.Caption).HasMaxLength(AppointmentPhotoConsts.MaxCaptionLength);

            b.HasOne<Appointment>().WithMany().HasForeignKey(x => x.AppointmentId).IsRequired();

            b.HasIndex(x => x.AppointmentId);
        });

        builder.Entity<ConsentForm>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "ConsentForms", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.BlobName).IsRequired();
            b.Property(x => x.FileName).IsRequired().HasMaxLength(ConsentFormConsts.MaxFileNameLength);
            b.Property(x => x.ContentType).IsRequired().HasMaxLength(ConsentFormConsts.MaxContentTypeLength);
            b.Property(x => x.FormTitle).IsRequired().HasMaxLength(ConsentFormConsts.MaxFormTitleLength);

            b.HasOne<Appointment>().WithMany().HasForeignKey(x => x.AppointmentId).IsRequired();

            b.HasIndex(x => x.AppointmentId);
        });

        builder.Entity<TreatmentPlan>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "TreatmentPlans", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Title).IsRequired().HasMaxLength(TreatmentPlanConsts.MaxTitleLength);
            b.Property(x => x.Notes).HasMaxLength(TreatmentPlanConsts.MaxNotesLength);

            b.HasOne<Patient>().WithMany().HasForeignKey(x => x.PatientId).IsRequired();

            b.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.TreatmentPlanId).IsRequired();
            b.Navigation(x => x.Items).HasField("_items").UsePropertyAccessMode(PropertyAccessMode.Field);

            b.HasIndex(x => x.PatientId);
            b.HasIndex(x => x.Status);
        });

        builder.Entity<TreatmentPlanItem>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "TreatmentPlanItems", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Description).IsRequired().HasMaxLength(TreatmentPlanConsts.MaxItemDescriptionLength);
            b.Property(x => x.EstimatedCost).HasColumnType("decimal(18,2)");

            b.HasOne<Service>().WithMany().HasForeignKey(x => x.ServiceId).IsRequired(false);
            b.HasOne<Appointment>().WithMany().HasForeignKey(x => x.AppointmentId).IsRequired(false);

            b.HasIndex(x => x.TreatmentPlanId);
            b.HasIndex(x => x.ServiceId);
            b.HasIndex(x => x.AppointmentId);
        });

        builder.Entity<InsurancePolicy>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "InsurancePolicies", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.ProviderName).IsRequired().HasMaxLength(InsurancePolicyConsts.MaxProviderNameLength);
            b.Property(x => x.PolicyNumber).IsRequired().HasMaxLength(InsurancePolicyConsts.MaxPolicyNumberLength);
            b.Property(x => x.Notes).HasMaxLength(InsurancePolicyConsts.MaxNotesLength);

            b.HasOne<Patient>().WithMany().HasForeignKey(x => x.PatientId).IsRequired();

            b.HasIndex(x => x.PatientId);
        });

        builder.Entity<Supply>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Supplies", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Name).IsRequired().HasMaxLength(SupplyConsts.MaxNameLength);
            b.Property(x => x.Unit).IsRequired().HasMaxLength(SupplyConsts.MaxUnitLength);
            b.Property(x => x.Quantity).HasColumnType("decimal(18,3)");
            b.Property(x => x.LowStockThreshold).HasColumnType("decimal(18,3)");
        });

        builder.Entity<SupplyUsage>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "SupplyUsages", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Quantity).HasColumnType("decimal(18,3)");
            b.Property(x => x.Notes).HasMaxLength(SupplyUsageConsts.MaxNotesLength);

            b.HasOne<Supply>().WithMany().HasForeignKey(x => x.SupplyId).IsRequired();
            b.HasOne<Appointment>().WithMany().HasForeignKey(x => x.AppointmentId).IsRequired(false);

            b.HasIndex(x => x.SupplyId);
            b.HasIndex(x => x.AppointmentId);
        });

        builder.Entity<LabWork>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "LabWorks", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.LabName).IsRequired().HasMaxLength(LabWorkConsts.MaxLabNameLength);
            b.Property(x => x.WorkType).IsRequired().HasMaxLength(LabWorkConsts.MaxWorkTypeLength);
            b.Property(x => x.Notes).HasMaxLength(LabWorkConsts.MaxNotesLength);
            b.Property(x => x.Cost).HasColumnType("decimal(18,2)");
            b.Property(x => x.ToothNumberList)
                .HasConversion(
                    numbers => JsonSerializer.Serialize(numbers, (JsonSerializerOptions?)null),
                    json => JsonSerializer.Deserialize<List<int>>(json, (JsonSerializerOptions?)null) ?? new List<int>())
                .Metadata.SetValueComparer(new ValueComparer<List<int>>(
                    (a, b2) => (a ?? new List<int>()).SequenceEqual(b2 ?? new List<int>()),
                    a => a.Aggregate(0, (hash, item) => HashCode.Combine(hash, item)),
                    a => a.ToList()));

            b.HasOne<Patient>().WithMany().HasForeignKey(x => x.PatientId).IsRequired();
            b.HasOne<Appointment>().WithMany().HasForeignKey(x => x.AppointmentId).IsRequired(false);

            b.HasIndex(x => x.PatientId);
            b.HasIndex(x => x.Status);
        });

        builder.Entity<Expense>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "Expenses", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Amount).HasColumnType("decimal(18,2)");
            b.Property(x => x.Description).HasMaxLength(ExpenseConsts.MaxDescriptionLength);

            b.HasOne<LabWork>().WithMany().HasForeignKey(x => x.LabWorkId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(x => x.ExpenseDate);
            b.HasIndex(x => x.Category);
            b.HasIndex(x => x.LabWorkId);
        });

        builder.Entity<TaskItem>(b =>
        {
            b.ToTable(DentifyConsts.DbTablePrefix + "TaskItems", DentifyConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Title).IsRequired().HasMaxLength(TaskConsts.MaxTitleLength);
            b.Property(x => x.Content).HasMaxLength(TaskConsts.MaxContentLength);

            b.HasIndex(x => x.IsDone);
            b.HasIndex(x => x.DueDate);
        });
    }
}
