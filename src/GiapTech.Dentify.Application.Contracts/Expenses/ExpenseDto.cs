using System;
using GiapTech.Dentify.Expenses;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Expenses;

public class ExpenseDto : FullAuditedEntityDto<Guid>
{
    public DateTime ExpenseDate { get; set; }
    public decimal Amount { get; set; }
    public ExpenseCategory Category { get; set; }
    public string? Description { get; set; }
    public Guid? LabWorkId { get; set; }
}
