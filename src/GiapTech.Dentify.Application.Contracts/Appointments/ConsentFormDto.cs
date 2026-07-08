using System;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class ConsentFormDto
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string FormTitle { get; set; } = string.Empty;
    public DateTime SignedAt { get; set; }
    public DateTime CreationTime { get; set; }
}
