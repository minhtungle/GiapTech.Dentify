using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Appointments;

namespace GiapTech.Dentify.Application.Contracts.Appointments;

public class CreateUpdatePrescriptionItemDto
{
    public Guid? Id { get; set; }

    [Required]
    [StringLength(PrescriptionItemConsts.MaxDrugNameLength)]
    public string DrugName { get; set; } = string.Empty;

    [StringLength(PrescriptionItemConsts.MaxDosageLength)]
    public string? Dosage { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; } = 1;

    [StringLength(PrescriptionItemConsts.MaxInstructionsLength)]
    public string? Instructions { get; set; }
}
