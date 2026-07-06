using System;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class PrescriptionItemDto
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public string DrugName { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public int Quantity { get; set; }
    public string? Instructions { get; set; }
}
