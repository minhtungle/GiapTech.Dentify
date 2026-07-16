using GiapTech.Dentify.LabWorks;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreLabWorkAppServiceTests : LabWorkAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
