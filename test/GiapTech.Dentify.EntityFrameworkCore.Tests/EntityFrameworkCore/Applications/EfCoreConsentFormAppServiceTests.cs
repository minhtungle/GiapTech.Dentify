using GiapTech.Dentify.Appointments;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreConsentFormAppServiceTests : ConsentFormAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
