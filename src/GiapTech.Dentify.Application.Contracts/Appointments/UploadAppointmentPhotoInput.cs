using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Appointments;
using Volo.Abp.Content;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class UploadAppointmentPhotoInput
{
    [StringLength(AppointmentPhotoConsts.MaxCaptionLength)]
    public string? Caption { get; set; }

    [Required]
    public IRemoteStreamContent File { get; set; } = null!;
}
