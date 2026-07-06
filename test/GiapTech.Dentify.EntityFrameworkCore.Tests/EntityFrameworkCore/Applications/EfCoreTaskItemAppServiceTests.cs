using GiapTech.Dentify.Tasks;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreTaskItemAppServiceTests : TaskItemAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
