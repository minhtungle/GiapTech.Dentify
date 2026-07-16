using System;

namespace GiapTech.Dentify.Application.Contracts.PatientPortal;

public class PatientPortalProfileDto
{
    public Guid PatientId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
}
