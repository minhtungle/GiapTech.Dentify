using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Doctors;

namespace GiapTech.Dentify.Application.Contracts.Doctors;

public class CreateUpdateDoctorDto
{
    [Required]
    public Guid IdentityUserId { get; set; }

    [StringLength(DoctorConsts.MaxSpecializationLength)]
    public string? Specialization { get; set; }
}
