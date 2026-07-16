using GiapTech.Dentify.Application.Contracts.Expenses;
using GiapTech.Dentify.Expenses;
using Riok.Mapperly.Abstractions;

namespace GiapTech.Dentify.Application.Expenses;

[Mapper]
public partial class ExpenseMapper
{
    [MapperIgnoreSource(nameof(Expense.ExtraProperties))]
    [MapperIgnoreSource(nameof(Expense.ConcurrencyStamp))]
    public partial ExpenseDto MapToDto(Expense expense);
}
