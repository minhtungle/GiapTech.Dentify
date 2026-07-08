using System;
using System.ComponentModel.DataAnnotations;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public class LinkPatientIdentityUserDto
{
    [Required]
    public Guid IdentityUserId { get; set; }
}
