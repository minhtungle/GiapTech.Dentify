using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Chairs;
using GiapTech.Dentify.Doctors;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.DistributedLocking;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using ServiceEntity = GiapTech.Dentify.Services.Service;

namespace GiapTech.Dentify.Application.Appointments;

[Authorize(DentifyPermissions.Appointments.Default)]
public class AppointmentAppService : ApplicationService, IAppointmentAppService
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly IRepository<Doctor, Guid> _doctorRepository;
    private readonly IRepository<ServiceEntity, Guid> _serviceRepository;
    private readonly IRepository<Chair, Guid> _chairRepository;
    private readonly IRepository<IdentityUser, Guid> _identityUserRepository;
    private readonly AppointmentMapper _appointmentMapper;
    private readonly IAbpDistributedLock _distributedLock;

    public AppointmentAppService(
        IAppointmentRepository appointmentRepository,
        IRepository<Patient, Guid> patientRepository,
        IRepository<Doctor, Guid> doctorRepository,
        IRepository<ServiceEntity, Guid> serviceRepository,
        IRepository<Chair, Guid> chairRepository,
        IRepository<IdentityUser, Guid> identityUserRepository,
        AppointmentMapper appointmentMapper,
        IAbpDistributedLock distributedLock)
    {
        _appointmentRepository = appointmentRepository;
        _patientRepository = patientRepository;
        _doctorRepository = doctorRepository;
        _serviceRepository = serviceRepository;
        _chairRepository = chairRepository;
        _identityUserRepository = identityUserRepository;
        _appointmentMapper = appointmentMapper;
        _distributedLock = distributedLock;
    }

    public virtual async Task<AppointmentDto> GetAsync(Guid id)
    {
        var appointment = await _appointmentRepository.GetWithDetailsAsync(id);
        return (await MapToDtosAsync(new List<Appointment> { appointment })).Single();
    }

    public virtual async Task<PagedResultDto<AppointmentDto>> GetListAsync(GetAppointmentListDto input)
    {
        var queryable = await _appointmentRepository.GetQueryableAsync();

        queryable = ApplyFilters(
            queryable,
            input.PatientId,
            input.DoctorId,
            input.ServiceId,
            input.ChairId,
            input.Status,
            input.PaymentStatus,
            input.FromDate,
            input.ToDate);

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
        await EnsureClinicalNotesPermissionAsync(input.PreOpNotes, input.PostOpNotes, existingPreOpNotes: null, existingPostOpNotes: null);

        await using var doctorLock = await AcquireDoubleBookingLockAsync("doctor", input.DoctorId);
        await using var chairLock = await AcquireDoubleBookingLockAsync("chair", input.ChairId);

        await EnsureDoctorNotDoubleBookedAsync(input.DoctorId, input.ScheduledDateTime, input.DurationMinutes, excludeAppointmentId: null);
        await EnsureChairNotDoubleBookedAsync(input.ChairId, input.ScheduledDateTime, input.DurationMinutes, excludeAppointmentId: null);

        var appointment = new Appointment(
            GuidGenerator.Create(),
            input.PatientId,
            input.ScheduledDateTime,
            input.Price,
            input.DoctorId,
            input.ServiceId,
            input.DurationMinutes,
            input.ChairId);

        appointment.ChangeStatus(input.Status);
        appointment.SetClinicalNotes(input.PreOpNotes, input.PostOpNotes);
        ApplyPrescriptionItems(appointment, input.PrescriptionItems);

        await _appointmentRepository.InsertAsync(appointment);

        return (await MapToDtosAsync(new List<Appointment> { appointment })).Single();
    }

    [Authorize(DentifyPermissions.Appointments.Update)]
    public virtual async Task<AppointmentDto> UpdateAsync(Guid id, CreateUpdateAppointmentDto input)
    {
        var appointment = await _appointmentRepository.GetWithDetailsAsync(id);

        await EnsurePatientExistsAsync(input.PatientId);
        await EnsureClinicalNotesPermissionAsync(input.PreOpNotes, input.PostOpNotes, appointment.PreOpNotes, appointment.PostOpNotes);

        await using var doctorLock = await AcquireDoubleBookingLockAsync("doctor", input.DoctorId);
        await using var chairLock = await AcquireDoubleBookingLockAsync("chair", input.ChairId);

        await EnsureDoctorNotDoubleBookedAsync(input.DoctorId, input.ScheduledDateTime, input.DurationMinutes, excludeAppointmentId: id);
        await EnsureChairNotDoubleBookedAsync(input.ChairId, input.ScheduledDateTime, input.DurationMinutes, excludeAppointmentId: id);

        appointment.AssignPatient(input.PatientId);
        appointment.Reschedule(input.ScheduledDateTime);
        appointment.SetDuration(input.DurationMinutes);
        appointment.AssignDoctor(input.DoctorId);
        appointment.ChangeStatus(input.Status);
        appointment.AssignService(input.ServiceId);
        appointment.AssignChair(input.ChairId);
        appointment.SetClinicalNotes(input.PreOpNotes, input.PostOpNotes);
        appointment.SetPrice(input.Price);
        ApplyPrescriptionItems(appointment, input.PrescriptionItems);

        await _appointmentRepository.UpdateAsync(appointment);

        return (await MapToDtosAsync(new List<Appointment> { appointment })).Single();
    }

    // Bọc kiểm tra double-booking + insert/update trong 1 distributed lock theo Doctor/Chair
    // để loại bỏ khoảng hở TOCTOU giữa lúc kiểm tra và lúc ghi (2 request đồng thời cho
    // cùng bác sĩ/ghế trùng giờ có thể cùng qua được kiểm tra trước khi bên nào insert xong).
    private async Task<IAbpDistributedLockHandle?> AcquireDoubleBookingLockAsync(string resourceType, Guid? resourceId)
    {
        if (!resourceId.HasValue)
        {
            return null;
        }

        var handle = await _distributedLock.TryAcquireAsync($"appointment-{resourceType}-{resourceId.Value}", TimeSpan.FromSeconds(10));
        if (handle == null)
        {
            throw new BusinessException(DentifyDomainErrorCodes.ConcurrentBookingInProgress);
        }

        return handle;
    }

    private async Task EnsureClinicalNotesPermissionAsync(
        string? newPreOpNotes, string? newPostOpNotes, string? existingPreOpNotes, string? existingPostOpNotes)
    {
        if (newPreOpNotes == existingPreOpNotes && newPostOpNotes == existingPostOpNotes)
        {
            return;
        }

        await AuthorizationService.CheckAsync(DentifyPermissions.Appointments.ManageClinicalNotes);
    }

    private async Task EnsureDoctorNotDoubleBookedAsync(
        Guid? doctorId, DateTime scheduledDateTime, int durationMinutes, Guid? excludeAppointmentId)
    {
        if (!doctorId.HasValue)
        {
            return;
        }

        var newStart = DateTime.SpecifyKind(scheduledDateTime, DateTimeKind.Utc);
        var newEnd = newStart.AddMinutes(durationMinutes);

        var queryable = await _appointmentRepository.GetQueryableAsync();
        var candidates = await AsyncExecuter.ToListAsync(
            queryable.Where(a =>
                a.DoctorId == doctorId.Value &&
                a.Status != AppointmentStatus.Cancelled &&
                (!excludeAppointmentId.HasValue || a.Id != excludeAppointmentId.Value)));

        var hasConflict = candidates.Any(a =>
        {
            var existingEnd = a.ScheduledDateTime.AddMinutes(a.DurationMinutes);
            return newStart < existingEnd && a.ScheduledDateTime < newEnd;
        });

        if (hasConflict)
        {
            throw new BusinessException(DentifyDomainErrorCodes.DoctorDoubleBooked);
        }
    }

    private async Task EnsureChairNotDoubleBookedAsync(
        Guid? chairId, DateTime scheduledDateTime, int durationMinutes, Guid? excludeAppointmentId)
    {
        if (!chairId.HasValue)
        {
            return;
        }

        var newStart = DateTime.SpecifyKind(scheduledDateTime, DateTimeKind.Utc);
        var newEnd = newStart.AddMinutes(durationMinutes);

        var queryable = await _appointmentRepository.GetQueryableAsync();
        var candidates = await AsyncExecuter.ToListAsync(
            queryable.Where(a =>
                a.ChairId == chairId.Value &&
                a.Status != AppointmentStatus.Cancelled &&
                (!excludeAppointmentId.HasValue || a.Id != excludeAppointmentId.Value)));

        var hasConflict = candidates.Any(a =>
        {
            var existingEnd = a.ScheduledDateTime.AddMinutes(a.DurationMinutes);
            return newStart < existingEnd && a.ScheduledDateTime < newEnd;
        });

        if (hasConflict)
        {
            throw new BusinessException(DentifyDomainErrorCodes.ChairDoubleBooked);
        }
    }

    private void ApplyPrescriptionItems(Appointment appointment, List<CreateUpdatePrescriptionItemDto> items)
    {
        var incomingIds = items.Where(x => x.Id.HasValue).Select(x => x.Id!.Value).ToHashSet();

        foreach (var existing in appointment.PrescriptionItems.ToList())
        {
            if (!incomingIds.Contains(existing.Id))
            {
                appointment.RemovePrescriptionItem(existing.Id);
            }
        }

        foreach (var item in items)
        {
            if (item.Id.HasValue)
            {
                appointment.UpdatePrescriptionItem(item.Id.Value, item.DrugName, item.Dosage, item.Quantity, item.Instructions, item.DrugId);
            }
            else
            {
                appointment.AddPrescriptionItem(GuidGenerator.Create(), item.DrugName, item.Dosage, item.Quantity, item.Instructions, item.DrugId);
            }
        }
    }

    [Authorize(DentifyPermissions.Appointments.Delete)]
    public virtual async Task DeleteAsync(Guid id)
    {
        await _appointmentRepository.DeleteAsync(id);
    }

    [Authorize(DentifyPermissions.Appointments.ManagePayment)]
    public virtual async Task<AppointmentDto> AddPaymentAsync(Guid id, CreatePaymentDto input)
    {
        var appointment = await _appointmentRepository.GetWithDetailsAsync(id);

        appointment.AddPayment(GuidGenerator.Create(), input.Amount, input.PaymentDate, input.Method, input.Notes);

        await _appointmentRepository.UpdateAsync(appointment);

        return (await MapToDtosAsync(new List<Appointment> { appointment })).Single();
    }

    [Authorize(DentifyPermissions.Appointments.ManagePayment)]
    public virtual async Task<AppointmentDto> RemovePaymentAsync(Guid id, Guid paymentId)
    {
        var appointment = await _appointmentRepository.GetWithDetailsAsync(id);

        appointment.RemovePayment(paymentId);

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
        var doctorQueryable = await _doctorRepository.GetQueryableAsync();
        var doctors = await AsyncExecuter.ToListAsync(
            doctorQueryable.Where(d => doctorIds.Contains(d.Id)));
        var doctorUserIdMap = doctors.ToDictionary(d => d.Id, d => d.IdentityUserId);

        var doctorUserIds = doctors.Select(d => d.IdentityUserId).Distinct().ToList();
        var userQueryable = await _identityUserRepository.GetQueryableAsync();
        var doctorUsers = await AsyncExecuter.ToListAsync(
            userQueryable
                .Where(u => doctorUserIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Name }));
        var doctorUserNameMap = doctorUsers.ToDictionary(u => u.Id, u => u.Name);

        var serviceIds = appointments.Where(a => a.ServiceId.HasValue).Select(a => a.ServiceId!.Value).Distinct().ToList();
        var serviceQueryable = await _serviceRepository.GetQueryableAsync();
        var services = await AsyncExecuter.ToListAsync(
            serviceQueryable.Where(s => serviceIds.Contains(s.Id)).Select(s => new { s.Id, s.Name }));
        var serviceNameMap = services.ToDictionary(s => s.Id, s => s.Name);

        var chairIds = appointments.Where(a => a.ChairId.HasValue).Select(a => a.ChairId!.Value).Distinct().ToList();
        var chairQueryable = await _chairRepository.GetQueryableAsync();
        var chairs = await AsyncExecuter.ToListAsync(
            chairQueryable.Where(c => chairIds.Contains(c.Id)).Select(c => new { c.Id, c.Name }));
        var chairNameMap = chairs.ToDictionary(c => c.Id, c => c.Name);

        return appointments.Select(appointment =>
        {
            var dto = _appointmentMapper.MapToDto(appointment);
            dto.PatientFullName = patientNameMap.TryGetValue(appointment.PatientId, out var patientName) ? patientName : string.Empty;
            dto.DoctorName = appointment.DoctorId.HasValue
                && doctorUserIdMap.TryGetValue(appointment.DoctorId.Value, out var doctorUserId)
                && doctorUserNameMap.TryGetValue(doctorUserId, out var doctorName)
                    ? doctorName
                    : null;
            dto.ServiceName = appointment.ServiceId.HasValue
                && serviceNameMap.TryGetValue(appointment.ServiceId.Value, out var serviceName)
                    ? serviceName
                    : null;
            dto.ChairName = appointment.ChairId.HasValue
                && chairNameMap.TryGetValue(appointment.ChairId.Value, out var chairName)
                    ? chairName
                    : null;
            return dto;
        }).ToList();
    }

    private static IQueryable<Appointment> ApplyFilters(
        IQueryable<Appointment> queryable,
        Guid? patientId,
        Guid? doctorId,
        Guid? serviceId,
        Guid? chairId,
        AppointmentStatus? status,
        PaymentStatus? paymentStatus,
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

        if (serviceId.HasValue)
        {
            queryable = queryable.Where(a => a.ServiceId == serviceId.Value);
        }

        if (chairId.HasValue)
        {
            queryable = queryable.Where(a => a.ChairId == chairId.Value);
        }

        if (status.HasValue)
        {
            queryable = queryable.Where(a => a.Status == status.Value);
        }

        if (paymentStatus.HasValue)
        {
            queryable = queryable.Where(a => a.PaymentStatus == paymentStatus.Value);
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
