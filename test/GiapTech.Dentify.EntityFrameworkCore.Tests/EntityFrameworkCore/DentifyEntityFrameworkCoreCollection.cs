using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore;

[CollectionDefinition(DentifyTestConsts.CollectionDefinitionName)]
public class DentifyEntityFrameworkCoreCollection : ICollectionFixture<DentifyEntityFrameworkCoreFixture>
{

}
