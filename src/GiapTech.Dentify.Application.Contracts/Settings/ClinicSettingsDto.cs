namespace GiapTech.Dentify.Application.Contracts.Settings;

public class ClinicSettingsDto
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public string? LogoUrl { get; set; }
}
