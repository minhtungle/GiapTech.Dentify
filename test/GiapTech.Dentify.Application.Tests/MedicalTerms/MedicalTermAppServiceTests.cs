using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.MedicalTerms;
using Shouldly;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.MedicalTerms;

public abstract class MedicalTermAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IMedicalTermAppService _medicalTermAppService;

    protected MedicalTermAppServiceTests()
    {
        _medicalTermAppService = GetRequiredService<IMedicalTermAppService>();
    }

    [Fact]
    public async Task Should_Create_MedicalTerm()
    {
        var result = await _medicalTermAppService.CreateAsync(new CreateUpdateMedicalTermDto
        {
            Name = "Dị ứng thử nghiệm",
            Category = MedicalTermCategory.Allergy
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.Name.ShouldBe("Dị ứng thử nghiệm");
        result.Category.ShouldBe(MedicalTermCategory.Allergy);
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Update_MedicalTerm_Name()
    {
        var term = await _medicalTermAppService.CreateAsync(new CreateUpdateMedicalTermDto
        {
            Name = "Tên cũ",
            Category = MedicalTermCategory.MedicalCondition
        });

        var updated = await _medicalTermAppService.UpdateAsync(term.Id, new CreateUpdateMedicalTermDto
        {
            Name = "Tên mới",
            Category = MedicalTermCategory.MedicalCondition
        });

        updated.Name.ShouldBe("Tên mới");
    }

    [Fact]
    public async Task Should_Only_List_Active_MedicalTerms_In_Given_Category()
    {
        var activeAllergy = await _medicalTermAppService.CreateAsync(new CreateUpdateMedicalTermDto
        {
            Name = "Dị ứng đang dùng",
            Category = MedicalTermCategory.Allergy
        });
        var inactiveAllergy = await _medicalTermAppService.CreateAsync(new CreateUpdateMedicalTermDto
        {
            Name = "Dị ứng ngừng dùng",
            Category = MedicalTermCategory.Allergy
        });
        await _medicalTermAppService.DeactivateAsync(inactiveAllergy.Id);

        var otherCategoryTerm = await _medicalTermAppService.CreateAsync(new CreateUpdateMedicalTermDto
        {
            Name = "Bệnh nền không liên quan",
            Category = MedicalTermCategory.MedicalCondition
        });

        var result = await _medicalTermAppService.GetActiveListAsync(MedicalTermCategory.Allergy);

        result.ShouldContain(x => x.Id == activeAllergy.Id);
        result.ShouldNotContain(x => x.Id == inactiveAllergy.Id);
        result.ShouldNotContain(x => x.Id == otherCategoryTerm.Id);
    }

    [Fact]
    public async Task Should_Reactivate_MedicalTerm()
    {
        var term = await _medicalTermAppService.CreateAsync(new CreateUpdateMedicalTermDto
        {
            Name = "Tag thử nghiệm",
            Category = MedicalTermCategory.Tag
        });

        await _medicalTermAppService.DeactivateAsync(term.Id);
        await _medicalTermAppService.ActivateAsync(term.Id);

        var result = await _medicalTermAppService.GetAsync(term.Id);
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task Should_Delete_MedicalTerm()
    {
        var term = await _medicalTermAppService.CreateAsync(new CreateUpdateMedicalTermDto
        {
            Name = "Mục sẽ xoá",
            Category = MedicalTermCategory.Tag
        });

        await _medicalTermAppService.DeleteAsync(term.Id);

        await Should.ThrowAsync<Exception>(async () => await _medicalTermAppService.GetAsync(term.Id));
    }

    [Fact]
    public async Task Should_Not_Create_Duplicate_Name_In_Same_Category()
    {
        await _medicalTermAppService.CreateAsync(new CreateUpdateMedicalTermDto
        {
            Name = "Trùng tên",
            Category = MedicalTermCategory.Allergy
        });

        await Should.ThrowAsync<Exception>(async () => await _medicalTermAppService.CreateAsync(
            new CreateUpdateMedicalTermDto { Name = "Trùng tên", Category = MedicalTermCategory.Allergy }));
    }
}
