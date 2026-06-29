using Microsoft.AspNetCore.Builder;
using GiapTech.Dentify;
using Volo.Abp.AspNetCore.TestBase;

var builder = WebApplication.CreateBuilder();
builder.Environment.ContentRootPath = GetWebProjectContentRootPathHelper.Get("GiapTech.Dentify.Web.csproj"); 
await builder.RunAbpModuleAsync<DentifyWebTestModule>(applicationName: "GiapTech.Dentify.Web");

public partial class Program
{
}
