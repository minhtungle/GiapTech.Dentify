using System.Collections.Generic;
using GiapTech.Dentify.Expenses;

namespace GiapTech.Dentify.Application.Contracts.Expenses;

public class ExpenseSummaryDto
{
    public decimal TotalAmount { get; set; }
    public List<ExpenseCategorySummaryDto> ByCategory { get; set; } = new();
}

public class ExpenseCategorySummaryDto
{
    public ExpenseCategory Category { get; set; }
    public decimal TotalAmount { get; set; }
}
