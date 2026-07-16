using GiapTech.Dentify.Waitlist;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreWaitlistEntryAppServiceTests : WaitlistEntryAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
