using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Expenses;

public class Expense : FullAuditedAggregateRoot<Guid>
{
    public DateTime ExpenseDate { get; private set; }
    public decimal Amount { get; private set; }
    public ExpenseCategory Category { get; private set; }
    public string? Description { get; private set; }

    protected Expense()
    {
    }

    public Expense(Guid id, DateTime expenseDate, decimal amount, ExpenseCategory category, string? description = null)
        : base(id)
    {
        SetExpenseDate(expenseDate);
        SetAmount(amount);
        Category = category;
        SetDescription(description);
    }

    public void SetExpenseDate(DateTime expenseDate)
    {
        ExpenseDate = DateTime.SpecifyKind(expenseDate, DateTimeKind.Utc);
    }

    public void SetAmount(decimal amount)
    {
        Check.Range(amount, nameof(amount), 0.01m, decimal.MaxValue);
        Amount = amount;
    }

    public void SetCategory(ExpenseCategory category)
    {
        Category = category;
    }

    public void SetDescription(string? description)
    {
        Description = Check.Length(description, nameof(description), ExpenseConsts.MaxDescriptionLength);
    }
}
