using System;
using System.Collections.Generic;
using GiapTech.Dentify.Patients;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public class PatientDto : FullAuditedEntityDto<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public List<string> Tags { get; set; } = new();
    public bool IsChildPatient { get; set; }
}
