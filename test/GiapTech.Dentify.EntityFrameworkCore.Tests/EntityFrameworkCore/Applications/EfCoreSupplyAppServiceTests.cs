using GiapTech.Dentify.Supplies;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreSupplyAppServiceTests : SupplyAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
