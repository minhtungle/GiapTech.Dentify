using System.Threading.Tasks;
using Shouldly;
using Xunit;

namespace GiapTech.Dentify.Pages;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class Index_Tests : DentifyWebTestBase
{
    [Fact]
    public async Task Welcome_Page()
    {
        var response = await GetResponseAsStringAsync("/");
        response.ShouldNotBeNull();
    }
}
