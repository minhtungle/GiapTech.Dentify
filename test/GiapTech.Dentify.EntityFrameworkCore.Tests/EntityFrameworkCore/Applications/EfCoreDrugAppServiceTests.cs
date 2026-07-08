using GiapTech.Dentify.Drugs;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreDrugAppServiceTests : DrugAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
