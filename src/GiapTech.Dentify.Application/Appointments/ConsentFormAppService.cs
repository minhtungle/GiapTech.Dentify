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

[Authorize(DentifyPermissions.ConsentForms.Default)]
public class ConsentFormAppService : ApplicationService, IConsentFormAppService
{
    private readonly IRepository<ConsentForm, Guid> _consentFormRepository;
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly IBlobContainer<ConsentFormContainer> _blobContainer;

    public ConsentFormAppService(
        IRepository<ConsentForm, Guid> consentFormRepository,
        IRepository<Appointment, Guid> appointmentRepository,
        IBlobContainer<ConsentFormContainer> blobContainer)
    {
        _consentFormRepository = consentFormRepository;
        _appointmentRepository = appointmentRepository;
        _blobContainer = blobContainer;
    }

    public virtual async Task<List<ConsentFormDto>> GetListAsync(Guid appointmentId)
    {
        var forms = await _consentFormRepository.GetListAsync(x => x.AppointmentId == appointmentId);
        return forms
            .OrderByDescending(x => x.CreationTime)
            .Select(MapToDto)
            .ToList();
    }

    [Authorize(DentifyPermissions.ConsentForms.Upload)]
    public virtual async Task<ConsentFormDto> UploadAsync(Guid appointmentId, UploadConsentFormInput input)
    {
        await _appointmentRepository.GetAsync(appointmentId);

        var file = input.File;
        var contentType = file.ContentType ?? "application/octet-stream";
        if (!ConsentFormConsts.AllowedContentTypes.Contains(contentType))
        {
            throw new BusinessException(DentifyDomainErrorCodes.UnsupportedConsentFormContentType);
        }

        await using var memoryStream = new MemoryStream();
        await file.GetStream().CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();

        if (bytes.LongLength > ConsentFormConsts.MaxSizeBytes)
        {
            throw new BusinessException(DentifyDomainErrorCodes.ConsentFormSizeTooLarge);
        }

        var id = GuidGenerator.Create();
        var blobName = $"{appointmentId}/{id}";

        await _blobContainer.SaveAsync(blobName, bytes);

        var consentForm = new ConsentForm(
            id,
            appointmentId,
            blobName,
            file.FileName ?? "consent-form",
            contentType,
            bytes.LongLength,
            input.FormTitle,
            input.SignedAt);

        await _consentFormRepository.InsertAsync(consentForm);

        return MapToDto(consentForm);
    }

    public virtual async Task<IRemoteStreamContent> DownloadAsync(Guid id)
    {
        var consentForm = await GetConsentFormOrThrowAsync(id);

        var stream = await _blobContainer.GetAsync(consentForm.BlobName);

        return new RemoteStreamContent(stream, consentForm.FileName, consentForm.ContentType);
    }

    [Authorize(DentifyPermissions.ConsentForms.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        var consentForm = await GetConsentFormOrThrowAsync(id);

        await _blobContainer.DeleteAsync(consentForm.BlobName);
        await _consentFormRepository.DeleteAsync(consentForm);
    }

    private async Task<ConsentForm> GetConsentFormOrThrowAsync(Guid id)
    {
        var consentForm = await _consentFormRepository.FindAsync(id);
        return consentForm ?? throw new BusinessException(DentifyDomainErrorCodes.ConsentFormNotFound);
    }

    private static ConsentFormDto MapToDto(ConsentForm consentForm)
    {
        return new ConsentFormDto
        {
            Id = consentForm.Id,
            AppointmentId = consentForm.AppointmentId,
            FileName = consentForm.FileName,
            ContentType = consentForm.ContentType,
            SizeBytes = consentForm.SizeBytes,
            FormTitle = consentForm.FormTitle,
            SignedAt = consentForm.SignedAt,
            CreationTime = consentForm.CreationTime
        };
    }
}
