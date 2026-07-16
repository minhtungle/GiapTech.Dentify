using GiapTech.Dentify.Doctors;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreDoctorAppServiceTests : DoctorAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
