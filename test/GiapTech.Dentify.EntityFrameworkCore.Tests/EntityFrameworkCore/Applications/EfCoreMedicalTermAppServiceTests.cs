using GiapTech.Dentify.MedicalTerms;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreMedicalTermAppServiceTests : MedicalTermAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
