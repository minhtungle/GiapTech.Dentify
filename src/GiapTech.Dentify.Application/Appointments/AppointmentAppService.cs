using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace GiapTech.Dentify.Application.Appointments;

[Authorize(DentifyPermissions.Appointments.Default)]
public class AppointmentAppService : ApplicationService, IAppointmentAppService
{
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly IRepository<IdentityUser, Guid> _identityUserRepository;
    private readonly AppointmentMapper _appointmentMapper;

    public AppointmentAppService(
        IRepository<Appointment, Guid> appointmentRepository,
        IRepository<Patient, Guid> patientRepository,
        IRepository<IdentityUser, Guid> identityUserRepository,
        AppointmentMapper appointmentMapper)
    {
        _appointmentRepository = appointmentRepository;
        _patientRepository = patientRepository;
        _identityUserRepository = identityUserRepository;
        _appointmentMapper = appointmentMapper;
    }

    public virtual async Task<AppointmentDto> GetAsync(Guid id)
    {
        var appointment = await _appointmentRepository.GetAsync(id);
        return (await MapToDtosAsync(new List<Appointment> { appointment })).Single();
    }

    public virtual async Task<PagedResultDto<AppointmentDto>> GetListAsync(GetAppointmentListDto input)
    {
        var queryable = await _appointmentRepository.GetQueryableAsync();

        queryable = ApplyFilters(queryable, input.PatientId, input.DoctorId, input.Status, input.FromDate, input.ToDate);

        var totalCount = await AsyncExecuter.CountAsync(queryable);

        queryable = Sort(queryable, input.Sorting);

        var appointments = await AsyncExecuter.ToListAsync(
            queryable.Skip(input.SkipCount).Take(input.MaxResultCount));

        var dtos = await MapToDtosAsync(appointments);

        return new PagedResultDto<AppointmentDto>(totalCount, dtos);
    }

    public virtual async Task<List<AppointmentDto>> GetCalendarViewAsync(DateTime fromDate, DateTime toDate)
    {
        var queryable = await _appointmentRepository.GetQueryableAsync();

        var appointments = await AsyncExecuter.ToListAsync(
            queryable
                .Where(a => a.ScheduledDateTime >= fromDate && a.ScheduledDateTime <= toDate)
                .OrderBy(a => a.ScheduledDateTime));

        return await MapToDtosAsync(appointments);
    }

    [Authorize(DentifyPermissions.Appointments.Create)]
    public virtual async Task<AppointmentDto> CreateAsync(CreateUpdateAppointmentDto input)
    {
        await EnsurePatientExistsAsync(input.PatientId);

        var appointment = new Appointment(
            GuidGenerator.Create(),
            input.PatientId,
            input.ScheduledDateTime,
            input.Price,
            input.DoctorId);

        appointment.ChangeStatus(input.Status);
        appointment.SetClinicalNotes(input.PreOpNotes, input.PostOpNotes, input.Prescription);

        await _appointmentRepository.InsertAsync(appointment);

        return (await MapToDtosAsync(new List<Appointment> { appointment })).Single();
    }

    [Authorize(DentifyPermissions.Appointments.Update)]
    public virtual async Task<AppointmentDto> UpdateAsync(Guid id, CreateUpdateAppointmentDto input)
    {
        var appointment = await _appointmentRepository.GetAsync(id);

        await EnsurePatientExistsAsync(input.PatientId);

        appointment.AssignPatient(input.PatientId);
        appointment.Reschedule(input.ScheduledDateTime);
        appointment.AssignDoctor(input.DoctorId);
        appointment.ChangeStatus(input.Status);
        appointment.SetClinicalNotes(input.PreOpNotes, input.PostOpNotes, input.Prescription);
        appointment.SetPrice(input.Price);

        await _appointmentRepository.UpdateAsync(appointment);

        return (await MapToDtosAsync(new List<Appointment> { appointment })).Single();
    }

    [Authorize(DentifyPermissions.Appointments.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _appointmentRepository.DeleteAsync(id);
    }

    [Authorize(DentifyPermissions.Appointments.ManagePayment)]
    public virtual async Task<AppointmentDto> UpdatePaymentAsync(Guid id, UpdatePaymentDto input)
    {
        var appointment = await _appointmentRepository.GetAsync(id);

        appointment.RecordPayment(input.PaidAmount);

        await _appointmentRepository.UpdateAsync(appointment);

        return (await MapToDtosAsync(new List<Appointment> { appointment })).Single();
    }

    private async Task EnsurePatientExistsAsync(Guid patientId)
    {
        await _patientRepository.GetAsync(patientId);
    }

    private async Task<List<AppointmentDto>> MapToDtosAsync(List<Appointment> appointments)
    {
        var patientIds = appointments.Select(a => a.PatientId).Distinct().ToList();
        var patientQueryable = await _patientRepository.GetQueryableAsync();
        var patientNames = await AsyncExecuter.ToListAsync(
            patientQueryable
                .Where(p => patientIds.Contains(p.Id))
                .Select(p => new { p.Id, p.FullName }));
        var patientNameMap = patientNames.ToDictionary(p => p.Id, p => p.FullName);

        var doctorIds = appointments.Where(a => a.DoctorId.HasValue).Select(a => a.DoctorId!.Value).Distinct().ToList();
        var userQueryable = await _identityUserRepository.GetQueryableAsync();
        var doctorNames = await AsyncExecuter.ToListAsync(
            userQueryable
                .Where(u => doctorIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Name }));
        var doctorNameMap = doctorNames.ToDictionary(u => u.Id, u => u.Name);

        return appointments.Select(appointment =>
        {
            var dto = _appointmentMapper.MapToDto(appointment);
            dto.PatientFullName = patientNameMap.TryGetValue(appointment.PatientId, out var patientName) ? patientName : string.Empty;
            dto.DoctorName = appointment.DoctorId.HasValue && doctorNameMap.TryGetValue(appointment.DoctorId.Value, out var doctorName)
                ? doctorName
                : null;
            return dto;
        }).ToList();
    }

    private static IQueryable<Appointment> ApplyFilters(
        IQueryable<Appointment> queryable,
        Guid? patientId,
        Guid? doctorId,
        AppointmentStatus? status,
        DateTime? fromDate,
        DateTime? toDate)
    {
        if (patientId.HasValue)
        {
            queryable = queryable.Where(a => a.PatientId == patientId.Value);
        }

        if (doctorId.HasValue)
        {
            queryable = queryable.Where(a => a.DoctorId == doctorId.Value);
        }

        if (status.HasValue)
        {
            queryable = queryable.Where(a => a.Status == status.Value);
        }

        if (fromDate.HasValue)
        {
            queryable = queryable.Where(a => a.ScheduledDateTime >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            queryable = queryable.Where(a => a.ScheduledDateTime <= toDate.Value);
        }

        return queryable;
    }

    private static IQueryable<Appointment> Sort(IQueryable<Appointment> queryable, string? sorting)
    {
        return sorting?.Trim().ToLowerInvariant() switch
        {
            "scheduleddatetime" => queryable.OrderBy(a => a.ScheduledDateTime),
            "scheduleddatetime desc" => queryable.OrderByDescending(a => a.ScheduledDateTime),
            "price" => queryable.OrderBy(a => a.Price),
            "price desc" => queryable.OrderByDescending(a => a.Price),
            _ => queryable.OrderByDescending(a => a.ScheduledDateTime)
        };
    }
}
