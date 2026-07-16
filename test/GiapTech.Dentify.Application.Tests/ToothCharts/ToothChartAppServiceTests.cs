using System;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Application.Contracts.ToothCharts;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.ToothCharts;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.ToothCharts;

public abstract class ToothChartAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IToothChartAppService _toothChartAppService;
    private readonly IPatientAppService _patientAppService;

    protected ToothChartAppServiceTests()
    {
        _toothChartAppService = GetRequiredService<IToothChartAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
    }

    private async Task<Guid> CreatePatientAsync(DateTime dateOfBirth)
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Tooth Chart Patient",
            DateOfBirth = dateOfBirth,
            Gender = Gender.Male
        });
        return patient.Id;
    }

    [Fact]
    public async Task Should_Create_Chart_With_Permanent_Teeth_For_Adult_Patient()
    {
        var patientId = await CreatePatientAsync(new DateTime(1990, 1, 1));

        var chart = await _toothChartAppService.GetAsync(patientId);

        chart.PatientId.ShouldBe(patientId);
        chart.IsChildPatient.ShouldBeFalse();
        chart.Records.Count.ShouldBe(32);
        chart.Records.ShouldAllBe(r => r.Status == ToothStatus.Healthy);
        chart.Records.ShouldContain(r => r.ToothNumber == 11);
        chart.Records.ShouldNotContain(r => r.ToothNumber == 51);
    }

    [Fact]
    public async Task Should_Create_Chart_With_Primary_Teeth_For_Child_Patient()
    {
        var patientId = await CreatePatientAsync(DateTime.Today.AddYears(-5));

        var chart = await _toothChartAppService.GetAsync(patientId);

        chart.IsChildPatient.ShouldBeTrue();
        chart.Records.Count.ShouldBe(20);
        chart.Records.ShouldContain(r => r.ToothNumber == 51);
        chart.Records.ShouldNotContain(r => r.ToothNumber == 11);
    }

    [Fact]
    public async Task Should_Return_Same_Chart_On_Subsequent_Calls()
    {
        var patientId = await CreatePatientAsync(new DateTime(1990, 1, 1));

        var first = await _toothChartAppService.GetAsync(patientId);
        await _toothChartAppService.UpdateStatusAsync(patientId, 11, new UpdateToothStatusDto
        {
            Status = ToothStatus.Decayed
        });
        var second = await _toothChartAppService.GetAsync(patientId);

        second.Records.Count.ShouldBe(first.Records.Count);
        second.Records.Single(r => r.ToothNumber == 11).Status.ShouldBe(ToothStatus.Decayed);
    }

    [Fact]
    public async Task Should_Update_Tooth_Status_And_Record_History()
    {
        var patientId = await CreatePatientAsync(new DateTime(1990, 1, 1));

        var updated = await _toothChartAppService.UpdateStatusAsync(patientId, 24, new UpdateToothStatusDto
        {
            Status = ToothStatus.Filled,
            Notes = "Filled after cavity treatment"
        });

        updated.ToothNumber.ShouldBe(24);
        updated.Status.ShouldBe(ToothStatus.Filled);
        updated.Notes.ShouldBe("Filled after cavity treatment");

        var history = await _toothChartAppService.GetHistoryAsync(patientId, 24);

        history.ShouldNotBeEmpty();
        history[0].Status.ShouldBe(ToothStatus.Filled);
        history[0].Notes.ShouldBe("Filled after cavity treatment");
    }

    [Fact]
    public async Task Should_Not_Overwrite_History_When_Status_Changes_Multiple_Times()
    {
        var patientId = await CreatePatientAsync(new DateTime(1990, 1, 1));

        await _toothChartAppService.UpdateStatusAsync(patientId, 36, new UpdateToothStatusDto { Status = ToothStatus.Decayed });
        await _toothChartAppService.UpdateStatusAsync(patientId, 36, new UpdateToothStatusDto { Status = ToothStatus.RootCanal });
        await _toothChartAppService.UpdateStatusAsync(patientId, 36, new UpdateToothStatusDto { Status = ToothStatus.Crown });

        var history = await _toothChartAppService.GetHistoryAsync(patientId, 36);

        history.Count.ShouldBe(3);
        history[0].Status.ShouldBe(ToothStatus.Crown);

        var chart = await _toothChartAppService.GetAsync(patientId);
        chart.Records.Single(r => r.ToothNumber == 36).Status.ShouldBe(ToothStatus.Crown);
    }

    [Fact]
    public async Task Should_Throw_BusinessException_For_Invalid_Tooth_Number()
    {
        var patientId = await CreatePatientAsync(new DateTime(1990, 1, 1));

        var exception = await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _toothChartAppService.UpdateStatusAsync(patientId, 99, new UpdateToothStatusDto
            {
                Status = ToothStatus.Decayed
            });
        });

        exception.Code.ShouldBe(DentifyDomainErrorCodes.InvalidToothNumber);
    }
}
