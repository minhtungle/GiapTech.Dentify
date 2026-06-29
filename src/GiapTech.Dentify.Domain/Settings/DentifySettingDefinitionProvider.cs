using Volo.Abp.Settings;

namespace GiapTech.Dentify.Settings;

public class DentifySettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        //Define your own settings here. Example:
        //context.Add(new SettingDefinition(DentifySettings.MySetting1));
    }
}
