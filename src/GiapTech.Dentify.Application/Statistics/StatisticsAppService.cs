using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Statistics;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace GiapTech.Dentify.Application.Statistics;

[Authorize(DentifyPermissions.Statistics.Default)]
public class StatisticsAppService : ApplicationService, IStatisticsAppService
{
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly IRepository<Payment, Guid> _paymentRepository;
    private readonly IRepository<IdentityUser, Guid> _identityUserRepository;

    public StatisticsAppService(
        IRepository<Appointment, Guid> appointmentRepository,
        IRepository<Payment, Guid> paymentRepository,
        IRepository<IdentityUser, Guid> identityUserRepository)
    {
        _appointmentRepository = appointmentRepository;
        _paymentRepository = paymentRepository;
        _identityUserRepository = identityUserRepository;
    }

    public virtual async Task<RevenueOverviewDto> GetRevenueOverviewAsync(DateTime fromDate, DateTime toDate)
    {
        var periodLength = toDate.Date - fromDate.Date;
        var previousFromDate = fromDate.Date - periodLength.Add(TimeSpan.FromDays(1));
        var previousToDate = fromDate.Date.AddTicks(-1);

        var paymentQueryable = await _paymentRepository.GetQueryableAsync();

        var currentPayments = await AsyncExecuter.ToListAsync(
            paymentQueryable.Where(p => p.PaymentDate >= fromDate.Date && p.PaymentDate <= toDate.Date.AddDays(1).AddTicks(-1)));

        var previousPayments = await AsyncExecuter.ToListAsync(
            paymentQueryable.Where(p => p.PaymentDate >= previousFromDate && p.PaymentDate <= previousToDate));

        var currentTotal = currentPayments.Sum(p => p.Amount);
        var previousTotal = previousPayments.Sum(p => p.Amount);

        var growthPercentage = previousTotal == 0
            ? (currentTotal > 0 ? 100 : 0)
            : Math.Round((currentTotal - previousTotal) / previousTotal * 100, 2);

        var points = currentPayments
            .GroupBy(p => p.PaymentDate.Date)
            .Select(g => new RevenuePointDto { Date = g.Key, Amount = g.Sum(p => p.Amount) })
            .OrderBy(p => p.Date)
            .ToList();

        return new RevenueOverviewDto
        {
            CurrentPeriodTotal = currentTotal,
            PreviousPeriodTotal = previousTotal,
            GrowthPercentage = growthPercentage,
            Points = points,
        };
    }

    public virtual async Task<List<TreatmentTypeStatisticDto>> GetTreatmentTypeStatisticsAsync(DateTime fromDate, DateTime toDate)
    {
        var queryable = await _appointmentRepository.GetQueryableAsync();

        var appointments = await AsyncExecuter.ToListAsync(
            queryable.Where(a => a.ScheduledDateTime >= fromDate.Date && a.ScheduledDateTime <= toDate.Date.AddDays(1).AddTicks(-1)));

        return appointments
            .GroupBy(a => a.TreatmentType)
            .Select(g => new TreatmentTypeStatisticDto
            {
                TreatmentType = g.Key,
                AppointmentCount = g.Count(),
                TotalRevenue = g.Sum(a => a.PaidAmount),
            })
            .OrderByDescending(x => x.AppointmentCount)
            .ToList();
    }

    public virtual async Task<List<DoctorStatisticDto>> GetDoctorStatisticsAsync(DateTime fromDate, DateTime toDate)
    {
        var queryable = await _appointmentRepository.GetQueryableAsync();

        var appointments = await AsyncExecuter.ToListAsync(
            queryable.Where(a => a.ScheduledDateTime >= fromDate.Date && a.ScheduledDateTime <= toDate.Date.AddDays(1).AddTicks(-1)));

        var doctorIds = appointments.Where(a => a.DoctorId.HasValue).Select(a => a.DoctorId!.Value).Distinct().ToList();
        var userQueryable = await _identityUserRepository.GetQueryableAsync();
        var doctorNames = await AsyncExecuter.ToListAsync(
            userQueryable.Where(u => doctorIds.Contains(u.Id)).Select(u => new { u.Id, u.Name }));
        var doctorNameMap = doctorNames.ToDictionary(u => u.Id, u => u.Name);

        return appointments
            .GroupBy(a => a.DoctorId)
            .Select(g => new DoctorStatisticDto
            {
                DoctorId = g.Key,
                DoctorName = g.Key.HasValue && doctorNameMap.TryGetValue(g.Key.Value, out var name)
                    ? name
                    : "Chưa phân công",
                AppointmentCount = g.Count(),
                TotalRevenue = g.Sum(a => a.PaidAmount),
            })
            .OrderByDescending(x => x.TotalRevenue)
            .ToList();
    }
}
