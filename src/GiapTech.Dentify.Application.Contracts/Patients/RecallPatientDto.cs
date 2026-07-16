using System;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public class RecallPatientDto
{
    public Guid PatientId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime LastCompletedDate { get; set; }
}
