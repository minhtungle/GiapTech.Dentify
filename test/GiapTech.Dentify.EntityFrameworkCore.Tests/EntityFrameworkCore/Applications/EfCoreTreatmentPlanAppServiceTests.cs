using GiapTech.Dentify.TreatmentPlans;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreTreatmentPlanAppServiceTests : TreatmentPlanAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
