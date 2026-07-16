using GiapTech.Dentify.Settings;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreClinicSettingsAppServiceTests : ClinicSettingsAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
