using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Permissions;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.PermissionManagement;
using Volo.Abp.Uow;

namespace GiapTech.Dentify.Application.Identity;

/* Seeds the clinic staff roles (Doctor/Receptionist/Accountant) and their
 * default permission grants. Runs automatically when DbMigrator seeds data,
 * same mechanism as OpenIddictDataSeedContributor.
 */
public class ClinicRoleDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    public const string DoctorRoleName = "Doctor";
    public const string ReceptionistRoleName = "Receptionist";
    public const string AccountantRoleName = "Accountant";
    public const string PatientRoleName = "Patient";

    private readonly IdentityRoleManager _roleManager;
    private readonly IPermissionManager _permissionManager;

    public ClinicRoleDataSeedContributor(
        IdentityRoleManager roleManager,
        IPermissionManager permissionManager)
    {
        _roleManager = roleManager;
        _permissionManager = permissionManager;
    }

    [UnitOfWork]
    public virtual async Task SeedAsync(DataSeedContext context)
    {
        await EnsureRoleAsync(DoctorRoleName, new[]
        {
            DentifyPermissions.Appointments.Update,
            DentifyPermissions.Appointments.ManageClinicalNotes,
            DentifyPermissions.ToothChart.Update,
            DentifyPermissions.AppointmentPhotos.Upload,
            DentifyPermissions.AppointmentPhotos.Delete,
        });

        await EnsureRoleAsync(ReceptionistRoleName, new[]
        {
            DentifyPermissions.Patients.Default,
            DentifyPermissions.Patients.Create,
            DentifyPermissions.Patients.Update,
            DentifyPermissions.Patients.Delete,
            DentifyPermissions.Patients.ManagePortalAccess,
            DentifyPermissions.Appointments.Create,
            DentifyPermissions.Appointments.Update,
            "AbpIdentity.Users",
        });

        await EnsureRoleAsync(AccountantRoleName, new[]
        {
            DentifyPermissions.Appointments.ManagePayment,
            DentifyPermissions.Expenses.Default,
            DentifyPermissions.Expenses.Create,
            DentifyPermissions.Expenses.Update,
            DentifyPermissions.Expenses.Delete,
            DentifyPermissions.Statistics.Default,
        });

        // Narrow, read-only permission set for self-service patient portal accounts —
        // intentionally excludes every staff Patients.*/Appointments.* permission.
        await EnsureRoleAsync(PatientRoleName, new[]
        {
            DentifyPermissions.PatientPortal.Default,
        });
    }

    private async Task EnsureRoleAsync(string roleName, string[] permissions)
    {
        var role = await _roleManager.FindByNameAsync(roleName);
        if (role == null)
        {
            role = new IdentityRole(Guid.NewGuid(), roleName)
            {
                IsStatic = true,
                IsPublic = true,
            };
            await _roleManager.CreateAsync(role);
        }

        foreach (var permission in permissions)
        {
            await _permissionManager.SetForRoleAsync(roleName, permission, isGranted: true);
        }
    }
}
