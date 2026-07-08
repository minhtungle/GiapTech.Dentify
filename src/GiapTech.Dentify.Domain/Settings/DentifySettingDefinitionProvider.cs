using Volo.Abp.Settings;

namespace GiapTech.Dentify.Settings;

public class DentifySettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        context.Add(
            new SettingDefinition(DentifySettings.Clinic.Name, "Dentify"),
            new SettingDefinition(DentifySettings.Clinic.Address),
            new SettingDefinition(DentifySettings.Clinic.PhoneNumber),
            new SettingDefinition(DentifySettings.Clinic.LogoUrl),
            new SettingDefinition(DentifySettings.Clinic.HasUploadedLogo, "false"),
            new SettingDefinition(DentifySettings.Clinic.ToothNotationSystem, "Iso3950")
        );
    }
}
