using System;
using GiapTech.Dentify.Expenses;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Expenses;

public class GetExpenseListDto : PagedAndSortedResultRequestDto
{
    public ExpenseCategory? Category { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
