using GiapTech.Dentify.Chairs;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreChairAppServiceTests : ChairAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
