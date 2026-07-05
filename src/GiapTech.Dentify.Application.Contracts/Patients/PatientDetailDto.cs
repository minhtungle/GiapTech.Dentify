using System;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public class PatientDetailDto
{
    public PatientDto Patient { get; set; } = null!;
    public DateTime? LastAppointmentDate { get; set; }
    public decimal TotalDebt { get; set; }
}
