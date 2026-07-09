using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Appointments;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class UpdateAppointmentPhotoCaptionInput
{
    [StringLength(AppointmentPhotoConsts.MaxCaptionLength)]
    public string? Caption { get; set; }
}
