using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.PatientPortal;
using GiapTech.Dentify.Appointments;
using GiapTech.Dentify.Doctors;
using GiapTech.Dentify.Patients;
using GiapTech.Dentify.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using ServiceEntity = GiapTech.Dentify.Services.Service;

namespace GiapTech.Dentify.Application.PatientPortal;

[Authorize(DentifyPermissions.PatientPortal.Default)]
public class PatientPortalAppService : ApplicationService, IPatientPortalAppService
{
    private readonly IRepository<Patient, Guid> _patientRepository;
    private readonly IRepository<Appointment, Guid> _appointmentRepository;
    private readonly IRepository<Doctor, Guid> _doctorRepository;
    private readonly IRepository<IdentityUser, Guid> _identityUserRepository;
    private readonly IRepository<ServiceEntity, Guid> _serviceRepository;

    public PatientPortalAppService(
        IRepository<Patient, Guid> patientRepository,
        IRepository<Appointment, Guid> appointmentRepository,
        IRepository<Doctor, Guid> doctorRepository,
        IRepository<IdentityUser, Guid> identityUserRepository,
        IRepository<ServiceEntity, Guid> serviceRepository)
    {
        _patientRepository = patientRepository;
        _appointmentRepository = appointmentRepository;
        _doctorRepository = doctorRepository;
        _identityUserRepository = identityUserRepository;
        _serviceRepository = serviceRepository;
    }

    public virtual async Task<PatientPortalProfileDto> GetMyProfileAsync()
    {
        var patient = await GetCurrentPatientAsync();

        return new PatientPortalProfileDto
        {
            PatientId = patient.Id,
            FullName = patient.FullName,
            DateOfBirth = patient.DateOfBirth,
            PhoneNumber = patient.PhoneNumber,
            Email = patient.Email
        };
    }

    public virtual async Task<List<PatientPortalAppointmentDto>> GetMyAppointmentsAsync(bool upcoming)
    {
        var patient = await GetCurrentPatientAsync();
        var now = Clock.Now;

        var queryable = await _appointmentRepository.GetQueryableAsync();
        var appointments = await AsyncExecuter.ToListAsync(
            queryable.Where(a => a.PatientId == patient.Id));

        var filtered = upcoming
            ? appointments.Where(a => a.ScheduledDateTime >= now && a.Status == AppointmentStatus.Scheduled)
            : appointments;

        var ordered = upcoming
            ? filtered.OrderBy(a => a.ScheduledDateTime)
            : filtered.OrderByDescending(a => a.ScheduledDateTime);

        return await MapToPortalDtosAsync(ordered.ToList());
    }

    public virtual async Task<List<PatientPortalAppointmentDto>> GetMyTreatmentHistoryAsync()
    {
        var patient = await GetCurrentPatientAsync();

        var queryable = await _appointmentRepository.GetQueryableAsync();
        var completedAppointments = await AsyncExecuter.ToListAsync(
            queryable.Where(a => a.PatientId == patient.Id && a.Status == AppointmentStatus.Completed));

        var ordered = completedAppointments.OrderByDescending(a => a.ScheduledDateTime).ToList();

        return await MapToPortalDtosAsync(ordered);
    }

    public virtual async Task<PatientPortalBalanceDto> GetMyBalanceAsync()
    {
        var patient = await GetCurrentPatientAsync();

        var queryable = await _appointmentRepository.GetQueryableAsync();
        var appointments = await AsyncExecuter.ToListAsync(
            queryable.Where(a => a.PatientId == patient.Id && a.Status != AppointmentStatus.Cancelled));

        var totalDebt = appointments.Sum(a => a.Price - a.PaidAmount);

        return new PatientPortalBalanceDto { TotalDebt = totalDebt };
    }

    private async Task<List<PatientPortalAppointmentDto>> MapToPortalDtosAsync(List<Appointment> appointments)
    {
        var doctorIds = appointments.Where(a => a.DoctorId.HasValue).Select(a => a.DoctorId!.Value).Distinct().ToList();
        var serviceIds = appointments.Where(a => a.ServiceId.HasValue).Select(a => a.ServiceId!.Value).Distinct().ToList();

        var doctorQueryable = await _doctorRepository.GetQueryableAsync();
        var doctors = await AsyncExecuter.ToListAsync(
            doctorQueryable.Where(d => doctorIds.Contains(d.Id)).Select(d => new { d.Id, d.IdentityUserId }));

        var identityUserIds = doctors.Select(d => d.IdentityUserId).Distinct().ToList();
        var identityUserQueryable = await _identityUserRepository.GetQueryableAsync();
        var identityUsers = await AsyncExecuter.ToListAsync(
            identityUserQueryable.Where(u => identityUserIds.Contains(u.Id)).Select(u => new { u.Id, u.Name }));
        var identityUserNameMap = identityUsers.ToDictionary(u => u.Id, u => u.Name);
        var doctorNameMap = doctors.ToDictionary(
            d => d.Id,
            d => identityUserNameMap.TryGetValue(d.IdentityUserId, out var name) ? name : string.Empty);

        var serviceQueryable = await _serviceRepository.GetQueryableAsync();
        var services = await AsyncExecuter.ToListAsync(
            serviceQueryable.Where(s => serviceIds.Contains(s.Id)).Select(s => new { s.Id, s.Name }));
        var serviceNameMap = services.ToDictionary(s => s.Id, s => s.Name);

        return appointments.Select(a => new PatientPortalAppointmentDto
        {
            Id = a.Id,
            ScheduledDateTime = a.ScheduledDateTime,
            DurationMinutes = a.DurationMinutes,
            Status = a.Status,
            DoctorName = a.DoctorId.HasValue && doctorNameMap.TryGetValue(a.DoctorId.Value, out var doctorName) ? doctorName : null,
            ServiceName = a.ServiceId.HasValue && serviceNameMap.TryGetValue(a.ServiceId.Value, out var serviceName) ? serviceName : null
        }).ToList();
    }

    private async Task<Patient> GetCurrentPatientAsync()
    {
        var identityUserId = CurrentUser.Id
            ?? throw new BusinessException(DentifyDomainErrorCodes.PatientPortalAccountNotLinked);

        var queryable = await _patientRepository.GetQueryableAsync();
        var patient = await AsyncExecuter.FirstOrDefaultAsync(
            queryable.Where(p => p.IdentityUserId == identityUserId));

        return patient ?? throw new BusinessException(DentifyDomainErrorCodes.PatientPortalAccountNotLinked);
    }
}
