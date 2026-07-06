using System;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Expenses;
using Shouldly;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Expenses;

public abstract class ExpenseAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IExpenseAppService _expenseAppService;

    protected ExpenseAppServiceTests()
    {
        _expenseAppService = GetRequiredService<IExpenseAppService>();
    }

    [Fact]
    public async Task Should_Create_And_Get_Expense()
    {
        var result = await _expenseAppService.CreateAsync(new CreateUpdateExpenseDto
        {
            ExpenseDate = new DateTime(2026, 1, 15),
            Amount = 1500000,
            Category = ExpenseCategory.Supplies,
            Description = "Găng tay, khẩu trang"
        });

        result.Amount.ShouldBe(1500000);
        result.Category.ShouldBe(ExpenseCategory.Supplies);

        var fetched = await _expenseAppService.GetAsync(result.Id);
        fetched.Description.ShouldBe("Găng tay, khẩu trang");
    }

    [Fact]
    public async Task Should_Filter_List_By_Category_And_Date_Range()
    {
        await _expenseAppService.CreateAsync(new CreateUpdateExpenseDto
        {
            ExpenseDate = new DateTime(2026, 2, 1),
            Amount = 100,
            Category = ExpenseCategory.Rent
        });
        var inRange = await _expenseAppService.CreateAsync(new CreateUpdateExpenseDto
        {
            ExpenseDate = new DateTime(2026, 3, 10),
            Amount = 200,
            Category = ExpenseCategory.Lab
        });

        var result = await _expenseAppService.GetListAsync(new GetExpenseListDto
        {
            Category = ExpenseCategory.Lab,
            FromDate = new DateTime(2026, 3, 1),
            ToDate = new DateTime(2026, 3, 31)
        });

        result.Items.ShouldContain(x => x.Id == inRange.Id);
        result.TotalCount.ShouldBe(1);
    }

    [Fact]
    public async Task Should_Compute_Summary_Grouped_By_Category()
    {
        await _expenseAppService.CreateAsync(new CreateUpdateExpenseDto
        {
            ExpenseDate = new DateTime(2026, 4, 1),
            Amount = 300,
            Category = ExpenseCategory.Lab
        });
        await _expenseAppService.CreateAsync(new CreateUpdateExpenseDto
        {
            ExpenseDate = new DateTime(2026, 4, 5),
            Amount = 700,
            Category = ExpenseCategory.Lab
        });
        await _expenseAppService.CreateAsync(new CreateUpdateExpenseDto
        {
            ExpenseDate = new DateTime(2026, 4, 10),
            Amount = 200,
            Category = ExpenseCategory.Rent
        });

        var summary = await _expenseAppService.GetSummaryAsync(new DateTime(2026, 4, 1), new DateTime(2026, 4, 30));

        summary.TotalAmount.ShouldBe(1200);
        summary.ByCategory.ShouldContain(x => x.Category == ExpenseCategory.Lab && x.TotalAmount == 1000);
        summary.ByCategory.ShouldContain(x => x.Category == ExpenseCategory.Rent && x.TotalAmount == 200);
    }

    [Fact]
    public async Task Should_Delete_Expense()
    {
        var expense = await _expenseAppService.CreateAsync(new CreateUpdateExpenseDto
        {
            ExpenseDate = DateTime.UtcNow,
            Amount = 50,
            Category = ExpenseCategory.Other
        });

        await _expenseAppService.DeleteAsync(expense.Id);

        await Should.ThrowAsync<Exception>(async () => await _expenseAppService.GetAsync(expense.Id));
    }
}
