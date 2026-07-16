using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.ToothCharts;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Permissions;
using GiapTech.Dentify.ToothCharts;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.ToothCharts;

[Authorize(DentifyPermissions.ToothChart.Default)]
public class ToothChartAppService : ApplicationService, IToothChartAppService
{
    private readonly IToothChartRepository _toothChartRepository;
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly IRepository<ToothRecordHistory, Guid> _historyRepository;

    public ToothChartAppService(
        IToothChartRepository toothChartRepository,
        IRepository<Patient, Guid> patientRepository,
        IRepository<ToothRecordHistory, Guid> historyRepository)
    {
        _toothChartRepository = toothChartRepository;
        _patientRepository = patientRepository;
        _historyRepository = historyRepository;
    }

    public virtual async Task<ToothChartDto> GetAsync(Guid id)
    {
        var patient = await _patientRepository.GetAsync(id);
        var toothChart = await GetOrCreateToothChartAsync(patient);

        return MapToDto(toothChart, patient.IsChildPatient);
    }

    [Authorize(DentifyPermissions.ToothChart.Update)]
    public virtual async Task<ToothRecordDto> UpdateStatusAsync(Guid patientId, int toothNumber, UpdateToothStatusDto input)
    {
        var patient = await _patientRepository.GetAsync(patientId);
        var toothChart = await GetOrCreateToothChartAsync(patient);

        var updatedAt = Clock.Now;
        var record = toothChart.UpdateToothStatus(toothNumber, input.Status, input.Notes, input.AppointmentId, updatedAt);

        await _toothChartRepository.UpdateAsync(toothChart);

        await _historyRepository.InsertAsync(
            new ToothRecordHistory(
                GuidGenerator.Create(),
                patientId,
                toothNumber,
                input.Status,
                input.Notes,
                input.AppointmentId,
                updatedAt));

        return MapToDto(record);
    }

    public virtual async Task<List<ToothRecordHistoryDto>> GetHistoryAsync(Guid patientId, int toothNumber)
    {
        var queryable = await _historyRepository.GetQueryableAsync();

        var history = await AsyncExecuter.ToListAsync(
            queryable
                .Where(h => h.PatientId == patientId && h.ToothNumber == toothNumber)
                .OrderByDescending(h => h.RecordedAt));

        return history.Select(MapToDto).ToList();
    }

    private async Task<ToothChart> GetOrCreateToothChartAsync(Patient patient)
    {
        var toothChart = await _toothChartRepository.FindByPatientIdAsync(patient.Id);
        if (toothChart != null)
        {
            return toothChart;
        }

        toothChart = new ToothChart(
            GuidGenerator.Create(),
            patient.Id,
            ToothNumbers.GetNumbersFor(patient.IsChildPatient));

        await _toothChartRepository.InsertAsync(toothChart);

        return toothChart;
    }

    private static ToothChartDto MapToDto(ToothChart toothChart, bool isChildPatient)
    {
        return new ToothChartDto
        {
            PatientId = toothChart.PatientId,
            IsChildPatient = isChildPatient,
            Records = toothChart.Records.OrderBy(r => r.ToothNumber).Select(MapToDto).ToList()
        };
    }

    private static ToothRecordDto MapToDto(ToothRecord record)
    {
        return new ToothRecordDto
        {
            ToothNumber = record.ToothNumber,
            Status = record.Status,
            Notes = record.Notes,
            LastUpdated = record.LastUpdated,
            UpdatedByAppointmentId = record.UpdatedByAppointmentId
        };
    }

    private static ToothRecordHistoryDto MapToDto(ToothRecordHistory history)
    {
        return new ToothRecordHistoryDto
        {
            ToothNumber = history.ToothNumber,
            Status = history.Status,
            Notes = history.Notes,
            AppointmentId = history.AppointmentId,
            RecordedAt = history.RecordedAt
        };
    }
}
