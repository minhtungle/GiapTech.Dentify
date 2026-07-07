using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace GiapTech.Dentify.Application.Patients;

[Authorize(DentifyPermissions.Patients.Default)]
public class PatientAppService : ApplicationService, IPatientAppService
{
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly PatientMapper _patientMapper;

    public PatientAppService(
        IRepository<Patient, Guid> patientRepository,
        IRepository<Appointment, Guid> appointmentRepository,
        PatientMapper patientMapper)
    {
        _patientRepository = patientRepository;
        _appointmentRepository = appointmentRepository;
        _patientMapper = patientMapper;
    }

    public virtual async Task<PatientDto> GetAsync(Guid id)
    {
        var patient = await GetPatientOrThrowAsync(id);
        return _patientMapper.MapToDto(patient);
    }

    public virtual async Task<PagedResultDto<PatientDto>> GetListAsync(GetPatientListDto input)
    {
        var queryable = await _patientRepository.GetQueryableAsync();

        if (!string.IsNullOrWhiteSpace(input.Filter))
        {
            var filter = input.Filter.Trim();
            queryable = queryable.Where(p =>
                p.FullName.Contains(filter) ||
                (p.PhoneNumber != null && p.PhoneNumber.Contains(filter)));
        }

        var patients = await AsyncExecuter.ToListAsync(queryable);

        if (!string.IsNullOrWhiteSpace(input.Tag))
        {
            patients = patients
                .Where(p => p.Tags.Any(t => string.Equals(t, input.Tag, StringComparison.OrdinalIgnoreCase)))
                .ToList();
        }

        var sortedPatients = Sort(patients, input.Sorting).ToList();
        var totalCount = sortedPatients.Count;

        var pagedPatients = sortedPatients
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount)
            .ToList();

        return new PagedResultDto<PatientDto>(
            totalCount,
            pagedPatients.Select(_patientMapper.MapToDto).ToList());
    }

    [Authorize(DentifyPermissions.Patients.Create)]
    public virtual async Task<PatientDto> CreateAsync(CreateUpdatePatientDto input)
    {
        var patient = new Patient(GuidGenerator.Create(), input.FullName, input.DateOfBirth, input.Gender);
        patient.SetContactInfo(input.PhoneNumber, input.Email, input.Address);
        patient.SetNotes(input.Notes);
        patient.SetTags(input.Tags);
        patient.SetAllergies(input.Allergies);
        patient.SetMedicalConditions(input.MedicalConditions);

        await _patientRepository.InsertAsync(patient);

        return _patientMapper.MapToDto(patient);
    }

    [Authorize(DentifyPermissions.Patients.Update)]
    public virtual async Task<PatientDto> UpdateAsync(Guid id, CreateUpdatePatientDto input)
    {
        var patient = await GetPatientOrThrowAsync(id);

        patient.SetFullName(input.FullName);
        patient.SetDateOfBirth(input.DateOfBirth);
        patient.SetGender(input.Gender);
        patient.SetContactInfo(input.PhoneNumber, input.Email, input.Address);
        patient.SetNotes(input.Notes);
        patient.SetTags(input.Tags);
        patient.SetAllergies(input.Allergies);
        patient.SetMedicalConditions(input.MedicalConditions);

        await _patientRepository.UpdateAsync(patient);

        return _patientMapper.MapToDto(patient);
    }

    [Authorize(DentifyPermissions.Patients.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _patientRepository.DeleteAsync(id);
    }

    public virtual async Task<PatientDetailDto> GetPatientDetailAsync(Guid id)
    {
        var patient = await GetPatientOrThrowAsync(id);

        var appointmentQueryable = await _appointmentRepository.GetQueryableAsync();
        var patientAppointments = await AsyncExecuter.ToListAsync(
            appointmentQueryable.Where(a => a.PatientId == id));

        var lastAppointmentDate = patientAppointments
            .OrderByDescending(a => a.ScheduledDateTime)
            .Select(a => (DateTime?)a.ScheduledDateTime)
            .FirstOrDefault();

        var totalDebt = patientAppointments.Sum(a => a.Price - a.PaidAmount);
        var noShowCount = patientAppointments.Count(a => a.Status == AppointmentStatus.NoShow);

        return new PatientDetailDto
        {
            Patient = _patientMapper.MapToDto(patient),
            LastAppointmentDate = lastAppointmentDate,
            TotalDebt = totalDebt,
            NoShowCount = noShowCount
        };
    }

    public virtual async Task<List<RecallPatientDto>> GetRecallListAsync(int monthsThreshold)
    {
        var now = Clock.Now;
        var cutoff = now.AddMonths(-monthsThreshold);

        var appointmentQueryable = await _appointmentRepository.GetQueryableAsync();
        var appointments = await AsyncExecuter.ToListAsync(appointmentQueryable);

        var hasUpcomingAppointment = appointments
            .Where(a => a.Status == AppointmentStatus.Scheduled && a.ScheduledDateTime > now)
            .Select(a => a.PatientId)
            .ToHashSet();

        var lastCompletedByPatient = appointments
            .Where(a => a.Status == AppointmentStatus.Completed)
            .GroupBy(a => a.PatientId)
            .Select(g => new { PatientId = g.Key, LastCompletedDate = g.Max(a => a.ScheduledDateTime) })
            .Where(x => x.LastCompletedDate < cutoff && !hasUpcomingAppointment.Contains(x.PatientId))
            .ToList();

        if (lastCompletedByPatient.Count == 0)
        {
            return new List<RecallPatientDto>();
        }

        var patientIds = lastCompletedByPatient.Select(x => x.PatientId).ToList();
        var patientQueryable = await _patientRepository.GetQueryableAsync();
        var patients = await AsyncExecuter.ToListAsync(
            patientQueryable.Where(p => patientIds.Contains(p.Id)));
        var patientMap = patients.ToDictionary(p => p.Id, p => p);

        return lastCompletedByPatient
            .Where(x => patientMap.ContainsKey(x.PatientId))
            .Select(x => new RecallPatientDto
            {
                PatientId = x.PatientId,
                FullName = patientMap[x.PatientId].FullName,
                PhoneNumber = patientMap[x.PatientId].PhoneNumber,
                LastCompletedDate = x.LastCompletedDate
            })
            .OrderBy(x => x.LastCompletedDate)
            .ToList();
    }

    private async Task<Patient> GetPatientOrThrowAsync(Guid id)
    {
        return await _patientRepository.GetAsync(id);
    }

    private static IEnumerable<Patient> Sort(IEnumerable<Patient> patients, string? sorting)
    {
        return sorting?.Trim().ToLowerInvariant() switch
        {
            "fullname" => patients.OrderBy(p => p.FullName),
            "fullname desc" => patients.OrderByDescending(p => p.FullName),
            "dateofbirth" => patients.OrderBy(p => p.DateOfBirth),
            "dateofbirth desc" => patients.OrderByDescending(p => p.DateOfBirth),
            "creationtime" => patients.OrderBy(p => p.CreationTime),
            _ => patients.OrderByDescending(p => p.CreationTime)
        };
    }
}
