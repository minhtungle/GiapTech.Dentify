using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Expenses;
using GiapTech.Dentify.Expenses;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.Expenses;

[Authorize(DentifyPermissions.Expenses.Default)]
public class ExpenseAppService : ApplicationService, IExpenseAppService
{
    private readonly IRepository<Expense, Guid> _expenseRepository;
    private readonly ExpenseMapper _expenseMapper;

    public ExpenseAppService(IRepository<Expense, Guid> expenseRepository, ExpenseMapper expenseMapper)
    {
        _expenseRepository = expenseRepository;
        _expenseMapper = expenseMapper;
    }

    public virtual async Task<ExpenseDto> GetAsync(Guid id)
    {
        var expense = await _expenseRepository.GetAsync(id);
        return _expenseMapper.MapToDto(expense);
    }

    public virtual async Task<PagedResultDto<ExpenseDto>> GetListAsync(GetExpenseListDto input)
    {
        var queryable = await _expenseRepository.GetQueryableAsync();

        queryable = ApplyFilters(queryable, input.Category, input.FromDate, input.ToDate, input.LabWorkId);

        var totalCount = await AsyncExecuter.CountAsync(queryable);

        queryable = queryable.OrderByDescending(x => x.ExpenseDate);

        var expenses = await AsyncExecuter.ToListAsync(
            queryable.Skip(input.SkipCount).Take(input.MaxResultCount));

        return new PagedResultDto<ExpenseDto>(totalCount, expenses.Select(_expenseMapper.MapToDto).ToList());
    }

    public virtual async Task<ExpenseSummaryDto> GetSummaryAsync(DateTime fromDate, DateTime toDate)
    {
        var queryable = await _expenseRepository.GetQueryableAsync();

        var expenses = await AsyncExecuter.ToListAsync(
            ApplyFilters(queryable, null, fromDate, toDate, null));

        return new ExpenseSummaryDto
        {
            TotalAmount = expenses.Sum(x => x.Amount),
            ByCategory = expenses
                .GroupBy(x => x.Category)
                .Select(g => new ExpenseCategorySummaryDto { Category = g.Key, TotalAmount = g.Sum(x => x.Amount) })
                .OrderByDescending(x => x.TotalAmount)
                .ToList()
        };
    }

    [Authorize(DentifyPermissions.Expenses.Create)]
    public virtual async Task<ExpenseDto> CreateAsync(CreateUpdateExpenseDto input)
    {
        var expense = new Expense(GuidGenerator.Create(), input.ExpenseDate, input.Amount, input.Category, input.Description, input.LabWorkId);

        await _expenseRepository.InsertAsync(expense);

        return _expenseMapper.MapToDto(expense);
    }

    [Authorize(DentifyPermissions.Expenses.Update)]
    public virtual async Task<ExpenseDto> UpdateAsync(Guid id, CreateUpdateExpenseDto input)
    {
        var expense = await _expenseRepository.GetAsync(id);

        expense.SetExpenseDate(input.ExpenseDate);
        expense.SetAmount(input.Amount);
        expense.SetCategory(input.Category);
        expense.SetDescription(input.Description);
        expense.LinkToLabWork(input.LabWorkId);

        await _expenseRepository.UpdateAsync(expense);

        return _expenseMapper.MapToDto(expense);
    }

    [Authorize(DentifyPermissions.Expenses.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _expenseRepository.DeleteAsync(id);
    }

    private static IQueryable<Expense> ApplyFilters(
        IQueryable<Expense> queryable, ExpenseCategory? category, DateTime? fromDate, DateTime? toDate, Guid? labWorkId)
    {
        if (category.HasValue)
        {
            queryable = queryable.Where(x => x.Category == category.Value);
        }

        if (fromDate.HasValue)
        {
            queryable = queryable.Where(x => x.ExpenseDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            queryable = queryable.Where(x => x.ExpenseDate <= toDate.Value);
        }

        if (labWorkId.HasValue)
        {
            queryable = queryable.Where(x => x.LabWorkId == labWorkId.Value);
        }

        return queryable;
    }
}
