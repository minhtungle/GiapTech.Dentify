using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace GiapTech.Dentify.Application.Contracts.Expenses;

public interface IExpenseAppService : IApplicationService
{
    Task<ExpenseDto> GetAsync(Guid id);

    Task<PagedResultDto<ExpenseDto>> GetListAsync(GetExpenseListDto input);

    Task<ExpenseSummaryDto> GetSummaryAsync(DateTime fromDate, DateTime toDate);

    Task<ExpenseDto> CreateAsync(CreateUpdateExpenseDto input);

    Task<ExpenseDto> UpdateAsync(Guid id, CreateUpdateExpenseDto input);

    Task DeleteAsync(Guid id);
}
