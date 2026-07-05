using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Patients;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public class CreateUpdatePatientDto
{
    [Required]
    [StringLength(PatientConsts.MaxFullNameLength)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public DateTime DateOfBirth { get; set; }

    public Gender Gender { get; set; }

    [StringLength(PatientConsts.MaxPhoneNumberLength)]
    public string? PhoneNumber { get; set; }

    [StringLength(PatientConsts.MaxEmailLength)]
    [EmailAddress]
    public string? Email { get; set; }

    [StringLength(PatientConsts.MaxAddressLength)]
    public string? Address { get; set; }

    [StringLength(PatientConsts.MaxNotesLength)]
    public string? Notes { get; set; }

    public List<string> Tags { get; set; } = new();
}
