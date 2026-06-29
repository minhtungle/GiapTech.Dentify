using GiapTech.Dentify.Samples;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Domains;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<DentifyEntityFrameworkCoreTestModule>
{

}
