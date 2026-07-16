using GiapTech.Dentify.Patients;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreInsurancePolicyAppServiceTests : InsurancePolicyAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
