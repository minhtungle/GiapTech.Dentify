using GiapTech.Dentify.Services;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreServiceAppServiceTests : ServiceAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
