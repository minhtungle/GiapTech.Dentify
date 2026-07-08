using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Patients;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public class CreateUpdateInsurancePolicyDto
{
    [Required]
    public Guid PatientId { get; set; }

    [Required]
    [StringLength(InsurancePolicyConsts.MaxProviderNameLength)]
    public string ProviderName { get; set; } = string.Empty;

    [Required]
    [StringLength(InsurancePolicyConsts.MaxPolicyNumberLength)]
    public string PolicyNumber { get; set; } = string.Empty;

    [Required]
    public DateTime EffectiveDate { get; set; }

    public DateTime? ExpiryDate { get; set; }

    [StringLength(InsurancePolicyConsts.MaxNotesLength)]
    public string? Notes { get; set; }
}
