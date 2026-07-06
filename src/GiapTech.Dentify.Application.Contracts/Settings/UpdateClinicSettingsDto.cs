using System.ComponentModel.DataAnnotations;

namespace GiapTech.Dentify.Application.Contracts.Settings;

public class UpdateClinicSettingsDto
{
    [Required]
    [StringLength(128)]
    public string Name { get; set; } = string.Empty;

    [StringLength(256)]
    public string? Address { get; set; }

    [StringLength(32)]
    public string? PhoneNumber { get; set; }

    [StringLength(512)]
    public string? LogoUrl { get; set; }
}
