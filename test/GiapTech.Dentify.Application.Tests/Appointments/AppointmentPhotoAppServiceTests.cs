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

public abstract class AppointmentPhotoAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IAppointmentPhotoAppService _appointmentPhotoAppService;
    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IPatientAppService _patientAppService;

    protected AppointmentPhotoAppServiceTests()
    {
        _appointmentPhotoAppService = GetRequiredService<IAppointmentPhotoAppService>();
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
    }

    private async Task<Guid> CreateAppointmentAsync()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Photo Test Patient",
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

    private static IRemoteStreamContent CreateFakeImage(string fileName = "test.jpg", string contentType = "image/jpeg")
    {
        var bytes = Encoding.UTF8.GetBytes("fake-image-bytes");
        return new RemoteStreamContent(new MemoryStream(bytes), fileName, contentType);
    }

    [Fact]
    public async Task Should_Upload_Photo_And_List_It()
    {
        var appointmentId = await CreateAppointmentAsync();

        var uploaded = await _appointmentPhotoAppService.UploadAsync(appointmentId, CreateFakeImage());

        uploaded.AppointmentId.ShouldBe(appointmentId);
        uploaded.FileName.ShouldBe("test.jpg");
        uploaded.ContentType.ShouldBe("image/jpeg");
        uploaded.SizeBytes.ShouldBeGreaterThan(0);

        var list = await _appointmentPhotoAppService.GetListAsync(appointmentId);
        list.ShouldContain(x => x.Id == uploaded.Id);
    }

    [Fact]
    public async Task Should_Download_Uploaded_Photo_With_Same_Content()
    {
        var appointmentId = await CreateAppointmentAsync();
        var uploaded = await _appointmentPhotoAppService.UploadAsync(appointmentId, CreateFakeImage());

        var downloaded = await _appointmentPhotoAppService.DownloadAsync(uploaded.Id);

        using var reader = new StreamReader(downloaded.GetStream());
        var content = await reader.ReadToEndAsync();
        content.ShouldBe("fake-image-bytes");
    }

    [Fact]
    public async Task Should_Delete_Photo()
    {
        var appointmentId = await CreateAppointmentAsync();
        var uploaded = await _appointmentPhotoAppService.UploadAsync(appointmentId, CreateFakeImage());

        await _appointmentPhotoAppService.DeleteAsync(uploaded.Id);

        var list = await _appointmentPhotoAppService.GetListAsync(appointmentId);
        list.ShouldNotContain(x => x.Id == uploaded.Id);
    }

    [Fact]
    public async Task Should_Throw_BusinessException_For_Unsupported_ContentType()
    {
        var appointmentId = await CreateAppointmentAsync();

        var exception = await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _appointmentPhotoAppService.UploadAsync(
                appointmentId,
                CreateFakeImage("virus.exe", "application/x-msdownload"));
        });

        exception.Code.ShouldBe(DentifyDomainErrorCodes.UnsupportedPhotoContentType);
    }

    [Fact]
    public async Task Should_Throw_BusinessException_When_Downloading_NonExistent_Photo()
    {
        var exception = await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _appointmentPhotoAppService.DownloadAsync(Guid.NewGuid());
        });

        exception.Code.ShouldBe(DentifyDomainErrorCodes.AppointmentPhotoNotFound);
    }
}
