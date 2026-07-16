using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Content;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Appointments;

public abstract class ConsentFormAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IConsentFormAppService _consentFormAppService;
    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IPatientAppService _patientAppService;

    protected ConsentFormAppServiceTests()
    {
        _consentFormAppService = GetRequiredService<IConsentFormAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
    }

    private async Task<Guid> CreateAppointmentAsync()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Consent Form Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male
        });

        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patient.Id,
            ScheduledDateTime = DateTime.UtcNow.AddDays(1),
            Status = AppointmentStatus.Scheduled,
            Price = 100
        });

        return appointment.Id;
    }

    private static UploadConsentFormInput CreateFakeForm(
        string fileName = "consent.pdf",
        string contentType = "application/pdf",
        string formTitle = "Đồng ý nhổ răng khôn")
    {
        var bytes = Encoding.UTF8.GetBytes("fake-pdf-bytes");
        return new UploadConsentFormInput
        {
            FormTitle = formTitle,
            SignedAt = DateTime.UtcNow,
            File = new RemoteStreamContent(new MemoryStream(bytes), fileName, contentType)
        };
    }

    [Fact]
    public async Task Should_Upload_ConsentForm_And_List_It()
    {
        var appointmentId = await CreateAppointmentAsync();

        var uploaded = await _consentFormAppService.UploadAsync(appointmentId, CreateFakeForm());

        uploaded.AppointmentId.ShouldBe(appointmentId);
        uploaded.FileName.ShouldBe("consent.pdf");
        uploaded.ContentType.ShouldBe("application/pdf");
        uploaded.FormTitle.ShouldBe("Đồng ý nhổ răng khôn");
        uploaded.SizeBytes.ShouldBeGreaterThan(0);

        var list = await _consentFormAppService.GetListAsync(appointmentId);
        list.ShouldContain(x => x.Id == uploaded.Id);
    }

    [Fact]
    public async Task Should_Download_Uploaded_ConsentForm_With_Same_Content()
    {
        var appointmentId = await CreateAppointmentAsync();
        var uploaded = await _consentFormAppService.UploadAsync(appointmentId, CreateFakeForm());

        var downloaded = await _consentFormAppService.DownloadAsync(uploaded.Id);

        using var reader = new StreamReader(downloaded.GetStream());
        var content = await reader.ReadToEndAsync();
        content.ShouldBe("fake-pdf-bytes");
    }

    [Fact]
    public async Task Should_Delete_ConsentForm()
    {
        var appointmentId = await CreateAppointmentAsync();
        var uploaded = await _consentFormAppService.UploadAsync(appointmentId, CreateFakeForm());

        await _consentFormAppService.DeleteAsync(uploaded.Id);

        var list = await _consentFormAppService.GetListAsync(appointmentId);
        list.ShouldNotContain(x => x.Id == uploaded.Id);
    }

    [Fact]
    public async Task Should_Throw_BusinessException_For_Unsupported_ContentType()
    {
        var appointmentId = await CreateAppointmentAsync();

        var exception = await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _consentFormAppService.UploadAsync(
                appointmentId,
                CreateFakeForm("virus.exe", "application/x-msdownload"));
        });

        exception.Code.ShouldBe(DentifyDomainErrorCodes.UnsupportedConsentFormContentType);
    }

    [Fact]
    public async Task Should_Throw_BusinessException_When_Downloading_NonExistent_ConsentForm()
    {
        var exception = await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _consentFormAppService.DownloadAsync(Guid.NewGuid());
        });

        exception.Code.ShouldBe(DentifyDomainErrorCodes.ConsentFormNotFound);
    }
}
