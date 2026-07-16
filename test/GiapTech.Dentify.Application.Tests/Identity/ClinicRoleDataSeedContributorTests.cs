using System.Threading.Tasks;
using GiapTech.Dentify.Application.Identity;
using GiapTech.Dentify.Permissions;
using Shouldly;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement;
using Xunit;

namespace GiapTech.Dentify.Identity;

public abstract class ClinicRoleDataSeedContributorTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private const string RoleProviderName = "R";

    private readonly IdentityRoleManager _roleManager;
    private readonly IPermissionManager _permissionManager;

    protected ClinicRoleDataSeedContributorTests()
    {
        _roleManager = GetRequiredService<IdentityRoleManager>();
        _permissionManager = GetRequiredService<IPermissionManager>();
    }

    [Theory]
    [InlineData(ClinicRoleDataSeedContributor.DoctorRoleName)]
    [InlineData(ClinicRoleDataSeedContributor.ReceptionistRoleName)]
    [InlineData(ClinicRoleDataSeedContributor.AccountantRoleName)]
    public async Task Should_Seed_Clinic_Role(string roleName)
    {
        var role = await _roleManager.FindByNameAsync(roleName);
        role.ShouldNotBeNull();
    }

    [Fact]
    public async Task Doctor_Role_Should_Have_ManageClinicalNotes_But_Not_ManagePayment()
    {
        var canManageNotes = await _permissionManager.GetAsync(
            DentifyPermissions.Appointments.ManageClinicalNotes, RoleProviderName, ClinicRoleDataSeedContributor.DoctorRoleName);
        var canManagePayment = await _permissionManager.GetAsync(
            DentifyPermissions.Appointments.ManagePayment, RoleProviderName, ClinicRoleDataSeedContributor.DoctorRoleName);

        canManageNotes.IsGranted.ShouldBeTrue();
        canManagePayment.IsGranted.ShouldBeFalse();
    }

    [Fact]
    public async Task Receptionist_Role_Should_Not_Have_ManageClinicalNotes()
    {
        var canManageNotes = await _permissionManager.GetAsync(
            DentifyPermissions.Appointments.ManageClinicalNotes, RoleProviderName, ClinicRoleDataSeedContributor.ReceptionistRoleName);

        canManageNotes.IsGranted.ShouldBeFalse();
    }

    [Fact]
    public async Task Accountant_Role_Should_Have_ManagePayment_And_Statistics()
    {
        var canManagePayment = await _permissionManager.GetAsync(
            DentifyPermissions.Appointments.ManagePayment, RoleProviderName, ClinicRoleDataSeedContributor.AccountantRoleName);
        var canViewStatistics = await _permissionManager.GetAsync(
            DentifyPermissions.Statistics.Default, RoleProviderName, ClinicRoleDataSeedContributor.AccountantRoleName);

        canManagePayment.IsGranted.ShouldBeTrue();
        canViewStatistics.IsGranted.ShouldBeTrue();
    }
}
