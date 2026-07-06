using GiapTech.Dentify.Expenses;
using Xunit;

namespace GiapTech.Dentify.EntityFrameworkCore.Applications;

[Collection(DentifyTestConsts.CollectionDefinitionName)]
public class EfCoreExpenseAppServiceTests : ExpenseAppServiceTests<DentifyEntityFrameworkCoreTestModule>
{

}
