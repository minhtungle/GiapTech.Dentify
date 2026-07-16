using GiapTech.Dentify.PatientPortal;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCorePatientPortalAppServiceTests : PatientPortalAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
