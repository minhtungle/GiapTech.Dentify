using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Doctors;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Doctors;

public abstract class DoctorAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IDoctorAppService _doctorAppService;
    private readonly IdentityUserManager _identityUserManager;

    protected DoctorAppServiceTests()
    {
        _doctorAppService = GetRequiredService<IDoctorAppService>();
        _identityUserManager = GetRequiredService<IdentityUserManager>();
    }

    private async Task<Guid> CreateTestUserAsync(string userName)
    {
        var user = new IdentityUser(Guid.NewGuid(), userName, $"{userName}@test.com")
        {
            Name = userName
        };
        var result = await _identityUserManager.CreateAsync(user);
        result.Succeeded.ShouldBeTrue();
        return user.Id;
    }

    [Fact]
    public async Task Should_Create_Doctor()
    {
        var userId = await CreateTestUserAsync("doctor.create");

        var result = await _doctorAppService.CreateAsync(new CreateUpdateDoctorDto
        {
            IdentityUserId = userId,
            Specialization = "Nha khoa tổng quát"
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.IdentityUserId.ShouldBe(userId);
        result.Specialization.ShouldBe("Nha khoa tổng quát");
        result.IsActive.ShouldBeTrue();
        result.FullName.ShouldBe("doctor.create");
    }

    [Fact]
    public async Task Should_Not_Create_Doctor_For_NonExisting_User()
    {
        await Should.ThrowAsync<Exception>(async () =>
        {
            await _doctorAppService.CreateAsync(new CreateUpdateDoctorDto
            {
                IdentityUserId = Guid.NewGuid()
            });
        });
    }

    [Fact]
    public async Task Should_Not_Link_Same_User_To_Two_Doctors()
    {
        var userId = await CreateTestUserAsync("doctor.duplicate");
        await _doctorAppService.CreateAsync(new CreateUpdateDoctorDto { IdentityUserId = userId });

        await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _doctorAppService.CreateAsync(new CreateUpdateDoctorDto { IdentityUserId = userId });
        });
    }

    [Fact]
    public async Task Should_Only_List_Active_Doctors()
    {
        var activeUserId = await CreateTestUserAsync("doctor.active");
        var inactiveUserId = await CreateTestUserAsync("doctor.inactive");

        var active = await _doctorAppService.CreateAsync(new CreateUpdateDoctorDto { IdentityUserId = activeUserId });
        var inactive = await _doctorAppService.CreateAsync(new CreateUpdateDoctorDto { IdentityUserId = inactiveUserId });
        await _doctorAppService.DeactivateAsync(inactive.Id);

        var result = await _doctorAppService.GetActiveListAsync();

        result.ShouldContain(x => x.Id == active.Id);
        result.ShouldNotContain(x => x.Id == inactive.Id);
    }

    [Fact]
    public async Task Should_Reactivate_Doctor()
    {
        var userId = await CreateTestUserAsync("doctor.reactivate");
        var doctor = await _doctorAppService.CreateAsync(new CreateUpdateDoctorDto { IdentityUserId = userId });

        await _doctorAppService.DeactivateAsync(doctor.Id);
        await _doctorAppService.ActivateAsync(doctor.Id);

        var result = await _doctorAppService.GetAsync(doctor.Id);
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Delete_Doctor()
    {
        var userId = await CreateTestUserAsync("doctor.delete");
        var doctor = await _doctorAppService.CreateAsync(new CreateUpdateDoctorDto { IdentityUserId = userId });

        await _doctorAppService.DeleteAsync(doctor.Id);

        await Should.ThrowAsync<Exception>(async () => await _doctorAppService.GetAsync(doctor.Id));
    }
}
