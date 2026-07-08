using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Content;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Appointments;

[Authorize(DentifyPermissions.AppointmentPhotos.Default)]
public class AppointmentPhotoAppService : ApplicationService, IAppointmentPhotoAppService
{
    private readonly IRepository<AppointmentPhoto, Guid> _photoRepository;
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly IBlobContainer<AppointmentPhotoContainer> _blobContainer;

    public AppointmentPhotoAppService(
        IRepository<AppointmentPhoto, Guid> photoRepository,
        IRepository<Appointment, Guid> appointmentRepository,
        IBlobContainer<AppointmentPhotoContainer> blobContainer)
    {
        _photoRepository = photoRepository;
        _appointmentRepository = appointmentRepository;
        _blobContainer = blobContainer;
    }

    public virtual async Task<List<AppointmentPhotoDto>> GetListAsync(Guid appointmentId)
    {
        var photos = await _photoRepository.GetListAsync(x => x.AppointmentId == appointmentId);
        return photos
            .OrderByDescending(x => x.CreationTime)
            .Select(MapToDto)
            .ToList();
    }

    [Authorize(DentifyPermissions.AppointmentPhotos.Upload)]
    public virtual async Task<AppointmentPhotoDto> UploadAsync(Guid appointmentId, UploadAppointmentPhotoInput input)
    {
        await _appointmentRepository.GetAsync(appointmentId);

        var file = input.File;
        var contentType = file.ContentType ?? "application/octet-stream";
        if (!AppointmentPhotoConsts.AllowedContentTypes.Contains(contentType))
        {
            throw new BusinessException(DentifyDomainErrorCodes.UnsupportedPhotoContentType);
        }

        await using var memoryStream = new MemoryStream();
        await file.GetStream().CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();

        if (bytes.LongLength > AppointmentPhotoConsts.MaxSizeBytes)
        {
            throw new BusinessException(DentifyDomainErrorCodes.PhotoSizeTooLarge);
        }

        var id = GuidGenerator.Create();
        var blobName = $"{appointmentId}/{id}";

        await _blobContainer.SaveAsync(blobName, bytes);

        var photo = new AppointmentPhoto(
            id,
            appointmentId,
            blobName,
            file.FileName ?? "photo",
            contentType,
            bytes.LongLength,
            input.Caption);

        await _photoRepository.InsertAsync(photo);

        return MapToDto(photo);
    }

    public virtual async Task<IRemoteStreamContent> DownloadAsync(Guid id)
    {
        var photo = await GetPhotoOrThrowAsync(id);

        var stream = await _blobContainer.GetAsync(photo.BlobName);

        return new RemoteStreamContent(stream, photo.FileName, photo.ContentType);
    }

    [Authorize(DentifyPermissions.AppointmentPhotos.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        var photo = await GetPhotoOrThrowAsync(id);

        await _blobContainer.DeleteAsync(photo.BlobName);
        await _photoRepository.DeleteAsync(photo);
    }

    private async Task<AppointmentPhoto> GetPhotoOrThrowAsync(Guid id)
    {
        var photo = await _photoRepository.FindAsync(id);
        return photo ?? throw new BusinessException(DentifyDomainErrorCodes.AppointmentPhotoNotFound);
    }

    private static AppointmentPhotoDto MapToDto(AppointmentPhoto photo)
    {
        return new AppointmentPhotoDto
        {
            Id = photo.Id,
            AppointmentId = photo.AppointmentId,
            FileName = photo.FileName,
            ContentType = photo.ContentType,
            SizeBytes = photo.SizeBytes,
            Caption = photo.Caption,
            CreationTime = photo.CreationTime
        };
    }
}
