using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Appointments;
using Volo.Abp.Content;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class UploadConsentFormInput
{
    [Required]
    [StringLength(ConsentFormConsts.MaxFormTitleLength)]
    public string FormTitle { get; set; } = string.Empty;

    public DateTime SignedAt { get; set; }

    [Required]
    public IRemoteStreamContent File { get; set; } = null!;
}
