using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Patients;
using Shouldly;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Patients;

public abstract class InsurancePolicyAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IInsurancePolicyAppService _insurancePolicyAppService;
    private readonly IPatientAppService _patientAppService;

    protected InsurancePolicyAppServiceTests()
    {
        _insurancePolicyAppService = GetRequiredService<IInsurancePolicyAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
    }

    private async Task<Guid> CreateTestPatientAsync()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Insurance Policy Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male
        });
        return patient.Id;
    }

    [Fact]
    public async Task Should_Create_InsurancePolicy()
    {
        var patientId = await CreateTestPatientAsync();

        var result = await _insurancePolicyAppService.CreateAsync(new CreateUpdateInsurancePolicyDto
        {
            PatientId = patientId,
            ProviderName = "Bảo Việt",
            PolicyNumber = "BV123456789",
            EffectiveDate = new DateTime(2026, 1, 1),
            ExpiryDate = new DateTime(2027, 1, 1)
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.PatientId.ShouldBe(patientId);
        result.ProviderName.ShouldBe("Bảo Việt");
        result.PolicyNumber.ShouldBe("BV123456789");
    }

    [Fact]
    public async Task Should_Update_InsurancePolicy()
    {
        var patientId = await CreateTestPatientAsync();
        var policy = await _insurancePolicyAppService.CreateAsync(new CreateUpdateInsurancePolicyDto
        {
            PatientId = patientId,
            ProviderName = "Bảo Việt",
            PolicyNumber = "BV000001",
            EffectiveDate = new DateTime(2026, 1, 1)
        });

        var updated = await _insurancePolicyAppService.UpdateAsync(policy.Id, new CreateUpdateInsurancePolicyDto
        {
            PatientId = patientId,
            ProviderName = "Bảo Việt",
            PolicyNumber = "BV000002",
            EffectiveDate = new DateTime(2026, 2, 1),
            ExpiryDate = new DateTime(2027, 2, 1),
            Notes = "Đổi số thẻ mới"
        });

        updated.PolicyNumber.ShouldBe("BV000002");
        updated.ExpiryDate.ShouldBe(new DateTime(2027, 2, 1));
        updated.Notes.ShouldBe("Đổi số thẻ mới");
    }

    [Fact]
    public async Task Should_List_InsurancePolicies_By_Patient()
    {
        var patientId = await CreateTestPatientAsync();
        var otherPatientId = await CreateTestPatientAsync();

        var ownPolicy = await _insurancePolicyAppService.CreateAsync(new CreateUpdateInsurancePolicyDto
        {
            PatientId = patientId,
            ProviderName = "Bảo Việt",
            PolicyNumber = "BV111",
            EffectiveDate = new DateTime(2026, 1, 1)
        });
        await _insurancePolicyAppService.CreateAsync(new CreateUpdateInsurancePolicyDto
        {
            PatientId = otherPatientId,
            ProviderName = "PVI",
            PolicyNumber = "PVI222",
            EffectiveDate = new DateTime(2026, 1, 1)
        });

        var result = await _insurancePolicyAppService.GetListAsync(patientId);

        result.ShouldContain(x => x.Id == ownPolicy.Id);
        result.ShouldAllBe(x => x.PatientId == patientId);
    }

    [Fact]
    public async Task Should_Delete_InsurancePolicy()
    {
        var patientId = await CreateTestPatientAsync();
        var policy = await _insurancePolicyAppService.CreateAsync(new CreateUpdateInsurancePolicyDto
        {
            PatientId = patientId,
            ProviderName = "Bảo Việt",
            PolicyNumber = "BV999",
            EffectiveDate = new DateTime(2026, 1, 1)
        });

        await _insurancePolicyAppService.DeleteAsync(policy.Id);

        var result = await _insurancePolicyAppService.GetListAsync(patientId);
        result.ShouldNotContain(x => x.Id == policy.Id);
    }
}
