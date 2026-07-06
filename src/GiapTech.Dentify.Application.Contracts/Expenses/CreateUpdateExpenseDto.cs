using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Expenses;

namespace GiapTech.Dentify.Application.Contracts.Expenses;

public class CreateUpdateExpenseDto
{
    [Required]
    public DateTime ExpenseDate { get; set; }

    [Range(0.01, (double)decimal.MaxValue)]
    public decimal Amount { get; set; }

    public ExpenseCategory Category { get; set; }

    [StringLength(ExpenseConsts.MaxDescriptionLength)]
    public string? Description { get; set; }
}
