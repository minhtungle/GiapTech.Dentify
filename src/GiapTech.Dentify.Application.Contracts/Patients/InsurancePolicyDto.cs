using System;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public class InsurancePolicyDto : FullAuditedEntityDto<Guid>
{
    public Guid PatientId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string PolicyNumber { get; set; } = string.Empty;
    public DateTime EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
}
