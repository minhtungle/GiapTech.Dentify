using GiapTech.Dentify.ToothCharts;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreToothChartAppServiceTests : ToothChartAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
