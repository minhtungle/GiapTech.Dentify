using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Chairs;
using GiapTech.Dentify.Application.Contracts.Doctors;
using GiapTech.Dentify.Application.Contracts.Drugs;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Application.Contracts.Services;
using GiapTech.Dentify.Doctors;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Appointments;

public abstract class AppointmentAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IPatientAppService _patientAppService;
    private readonly IDoctorAppService _doctorAppService;
    private readonly IServiceAppService _serviceAppService;
    private readonly IDrugAppService _drugAppService;
    private readonly IChairAppService _chairAppService;
    private readonly IdentityUserManager _identityUserManager;

    protected AppointmentAppServiceTests()
    {
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
        _doctorAppService = GetRequiredService<IDoctorAppService>();
        _serviceAppService = GetRequiredService<IServiceAppService>();
        _drugAppService = GetRequiredService<IDrugAppService>();
        _chairAppService = GetRequiredService<IChairAppService>();
        _identityUserManager = GetRequiredService<IdentityUserManager>();
    }

    private async Task<Guid> CreateTestPatientAsync()
    {
        var patient = await _patientAppService.CreateAsync(new CreateUpdatePatientDto
        {
            FullName = "Appointment Test Patient",
            DateOfBirth = new DateTime(1990, 1, 1)
        });
        return patient.Id;
    }

    private async Task<Guid> CreateTestDoctorAsync(string userName)
    {
        var user = new IdentityUser(Guid.NewGuid(), userName, $"{userName}@test.com");
        var result = await _identityUserManager.CreateAsync(user);
        result.Succeeded.ShouldBeTrue();

        var doctor = await _doctorAppService.CreateAsync(new CreateUpdateDoctorDto { IdentityUserId = user.Id });
        return doctor.Id;
    }

    private async Task<Guid> CreateTestServiceAsync(string name)
    {
        var service = await _serviceAppService.CreateAsync(new CreateUpdateServiceDto { Name = name, Price = 100000 });
        return service.Id;
    }

    private async Task<Guid> CreateTestDrugAsync(string name)
    {
        var drug = await _drugAppService.CreateAsync(new CreateUpdateDrugDto { Name = name });
        return drug.Id;
    }

    private async Task<Guid> CreateTestChairAsync(string name)
    {
        var chair = await _chairAppService.CreateAsync(new CreateUpdateChairDto { Name = name });
        return chair.Id;
    }

    [Fact]
    public async Task Should_Create_Appointment()
    {
        var patientId = await CreateTestPatientAsync();

        var result = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            Price = 500000
        });

        result.Id.ShouldNotBe(Guid.Empty);
        result.PatientFullName.ShouldBe("Appointment Test Patient");
        result.Status.ShouldBe(AppointmentStatus.Scheduled);
        result.PaymentStatus.ShouldBe(PaymentStatus.Unpaid);
    }

    [Fact]
    public async Task Should_Not_Create_Appointment_For_NonExisting_Patient()
    {
        await Should.ThrowAsync<Exception>(async () =>
        {
            await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
            {
                PatientId = Guid.NewGuid(),
                ScheduledDateTime = DateTime.Now,
                Price = 100
            });
        });
    }

    [Fact]
    public async Task Should_Update_Payment_And_Recalculate_Payment_Status()
    {
        var patientId = await CreateTestPatientAsync();
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now,
            Price = 1000
        });

        var partiallyPaid = await _appointmentAppService.AddPaymentAsync(appointment.Id, new CreatePaymentDto { Amount = 400, PaymentDate = DateTime.Now });
        partiallyPaid.PaymentStatus.ShouldBe(PaymentStatus.PartiallyPaid);
        partiallyPaid.PaidAmount.ShouldBe(400);

        var fullyPaid = await _appointmentAppService.AddPaymentAsync(appointment.Id, new CreatePaymentDto { Amount = 600, PaymentDate = DateTime.Now });
        fullyPaid.PaymentStatus.ShouldBe(PaymentStatus.Paid);
        fullyPaid.PaidAmount.ShouldBe(1000);
        fullyPaid.Payments.Count.ShouldBe(2);
    }

    [Fact]
    public async Task Should_Remove_Payment_And_Recalculate_Payment_Status()
    {
        var patientId = await CreateTestPatientAsync();
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now,
            Price = 1000
        });

        var afterAdd = await _appointmentAppService.AddPaymentAsync(appointment.Id, new CreatePaymentDto { Amount = 400, PaymentDate = DateTime.Now });
        var paymentId = afterAdd.Payments.Single().Id;

        var afterRemove = await _appointmentAppService.RemovePaymentAsync(appointment.Id, paymentId);

        afterRemove.PaidAmount.ShouldBe(0);
        afterRemove.PaymentStatus.ShouldBe(PaymentStatus.Unpaid);
        afterRemove.Payments.ShouldBeEmpty();
    }

    [Fact]
    public async Task Should_Not_Allow_Payment_Exceeding_Price()
    {
        var patientId = await CreateTestPatientAsync();
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now,
            Price = 100
        });

        await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _appointmentAppService.AddPaymentAsync(appointment.Id, new CreatePaymentDto { Amount = 200, PaymentDate = DateTime.Now });
        });
    }

    [Fact]
    public async Task Should_Get_Calendar_View_Within_Date_Range()
    {
        var patientId = await CreateTestPatientAsync();
        var inRange = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = new DateTime(2030, 6, 15),
            Price = 100
        });
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = new DateTime(2031, 1, 1),
            Price = 100
        });

        var result = await _appointmentAppService.GetCalendarViewAsync(
            new DateTime(2030, 6, 1), new DateTime(2030, 6, 30));

        result.ShouldContain(a => a.Id == inRange.Id);
        result.Count.ShouldBe(1);
    }

    [Fact]
    public async Task Should_Delete_Appointment()
    {
        var patientId = await CreateTestPatientAsync();
        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now,
            Price = 100
        });

        await _appointmentAppService.DeleteAsync(appointment.Id);

        await Should.ThrowAsync<Exception>(async () => await _appointmentAppService.GetAsync(appointment.Id));
    }

    [Fact]
    public async Task Should_Create_Appointment_With_Prescription_Items()
    {
        var patientId = await CreateTestPatientAsync();

        var result = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            Price = 500000,
            PrescriptionItems = new List<CreateUpdatePrescriptionItemDto>
            {
                new() { DrugName = "Amoxicillin", Dosage = "500mg", Quantity = 20, Instructions = "Uống 2 lần/ngày sau ăn" },
                new() { DrugName = "Paracetamol", Dosage = "500mg", Quantity = 10 }
            }
        });

        result.PrescriptionItems.Count.ShouldBe(2);
        result.PrescriptionItems.ShouldContain(x => x.DrugName == "Amoxicillin" && x.Quantity == 20);

        var fetched = await _appointmentAppService.GetAsync(result.Id);
        fetched.PrescriptionItems.Count.ShouldBe(2);
    }

    [Fact]
    public async Task Should_Update_Prescription_Items_Add_Edit_Remove()
    {
        var patientId = await CreateTestPatientAsync();
        var created = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            Price = 100,
            PrescriptionItems = new List<CreateUpdatePrescriptionItemDto>
            {
                new() { DrugName = "Ibuprofen", Quantity = 5 },
                new() { DrugName = "ToBeRemoved", Quantity = 1 }
            }
        });

        var toKeep = created.PrescriptionItems.Single(x => x.DrugName == "Ibuprofen");

        var updated = await _appointmentAppService.UpdateAsync(created.Id, new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = created.ScheduledDateTime,
            Price = 100,
            PrescriptionItems = new List<CreateUpdatePrescriptionItemDto>
            {
                new() { Id = toKeep.Id, DrugName = "Ibuprofen", Quantity = 15, Dosage = "200mg" },
                new() { DrugName = "NewDrug", Quantity = 3 }
            }
        });

        updated.PrescriptionItems.Count.ShouldBe(2);
        updated.PrescriptionItems.ShouldContain(x => x.Id == toKeep.Id && x.Quantity == 15 && x.Dosage == "200mg");
        updated.PrescriptionItems.ShouldContain(x => x.DrugName == "NewDrug");
        updated.PrescriptionItems.ShouldNotContain(x => x.DrugName == "ToBeRemoved");
    }

    [Fact]
    public async Task Should_Create_Appointment_With_Duration()
    {
        var patientId = await CreateTestPatientAsync();

        var result = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            DurationMinutes = 45,
            Price = 100
        });

        result.DurationMinutes.ShouldBe(45);
    }

    [Fact]
    public async Task Should_Not_Allow_Duration_Outside_Range()
    {
        var patientId = await CreateTestPatientAsync();

        await Should.ThrowAsync<Exception>(async () =>
        {
            await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
            {
                PatientId = patientId,
                ScheduledDateTime = DateTime.Now.AddDays(1),
                DurationMinutes = 1,
                Price = 100
            });
        });
    }

    [Fact]
    public async Task Should_Not_Allow_DoubleBooking_Same_Doctor_Overlapping_Time()
    {
        var patientId = await CreateTestPatientAsync();
        var doctorId = await CreateTestDoctorAsync("doctor.doublebooking");
        var scheduledAt = new DateTime(2030, 3, 10, 9, 0, 0);

        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Price = 100
        });

        await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
            {
                PatientId = patientId,
                DoctorId = doctorId,
                ScheduledDateTime = scheduledAt.AddMinutes(15),
                DurationMinutes = 30,
                Price = 100
            });
        });
    }

    [Fact]
    public async Task Should_Allow_Booking_Same_Doctor_NonOverlapping_Time()
    {
        var patientId = await CreateTestPatientAsync();
        var doctorId = await CreateTestDoctorAsync("doctor.nonoverlap");
        var scheduledAt = new DateTime(2030, 3, 11, 9, 0, 0);

        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Price = 100
        });

        var second = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            ScheduledDateTime = scheduledAt.AddMinutes(30),
            DurationMinutes = 30,
            Price = 100
        });

        second.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task Should_Not_Allow_DoubleBooking_When_Updating_Into_Conflict()
    {
        var patientId = await CreateTestPatientAsync();
        var doctorId = await CreateTestDoctorAsync("doctor.updateconflict");
        var scheduledAt = new DateTime(2030, 3, 12, 9, 0, 0);

        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Price = 100
        });

        var second = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            ScheduledDateTime = scheduledAt.AddHours(2),
            DurationMinutes = 30,
            Price = 100
        });

        await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _appointmentAppService.UpdateAsync(second.Id, new CreateUpdateAppointmentDto
            {
                PatientId = patientId,
                DoctorId = doctorId,
                ScheduledDateTime = scheduledAt,
                DurationMinutes = 30,
                Price = 100
            });
        });
    }

    [Fact]
    public async Task Should_Ignore_Cancelled_Appointments_When_Checking_DoubleBooking()
    {
        var patientId = await CreateTestPatientAsync();
        var doctorId = await CreateTestDoctorAsync("doctor.cancelled");
        var scheduledAt = new DateTime(2030, 3, 13, 9, 0, 0);

        var cancelled = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Price = 100
        });
        await _appointmentAppService.UpdateAsync(cancelled.Id, new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Status = AppointmentStatus.Cancelled,
            Price = 100
        });

        var result = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Price = 100
        });

        result.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task Should_Create_Appointment_With_Service()
    {
        var patientId = await CreateTestPatientAsync();
        var serviceId = await CreateTestServiceAsync("Khám tổng quát test");

        var result = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ServiceId = serviceId,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            Price = 100
        });

        result.ServiceId.ShouldBe(serviceId);
        result.ServiceName.ShouldBe("Khám tổng quát test");
    }

    [Fact]
    public async Task Should_Update_Appointment_Service()
    {
        var patientId = await CreateTestPatientAsync();
        var firstServiceId = await CreateTestServiceAsync("Dịch vụ ban đầu");
        var secondServiceId = await CreateTestServiceAsync("Dịch vụ mới");

        var appointment = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ServiceId = firstServiceId,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            Price = 100
        });

        var updated = await _appointmentAppService.UpdateAsync(appointment.Id, new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ServiceId = secondServiceId,
            ScheduledDateTime = appointment.ScheduledDateTime,
            DurationMinutes = appointment.DurationMinutes,
            Price = 100
        });

        updated.ServiceId.ShouldBe(secondServiceId);
        updated.ServiceName.ShouldBe("Dịch vụ mới");
    }

    [Fact]
    public async Task Should_Create_Appointment_With_Prescription_Item_Linked_To_Drug()
    {
        var patientId = await CreateTestPatientAsync();
        var drugId = await CreateTestDrugAsync("Amoxicillin test");

        var result = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = DateTime.Now.AddDays(1),
            Price = 100,
            PrescriptionItems = new List<CreateUpdatePrescriptionItemDto>
            {
                new() { DrugId = drugId, DrugName = "Amoxicillin test", Quantity = 10 }
            }
        });

        result.PrescriptionItems.Single().DrugId.ShouldBe(drugId);
    }

    [Fact]
    public async Task Should_Not_Allow_DoubleBooking_Same_Chair_Overlapping_Time()
    {
        var patientId = await CreateTestPatientAsync();
        var chairId = await CreateTestChairAsync("Ghế double-booking test");
        var scheduledAt = new DateTime(2030, 4, 10, 9, 0, 0);

        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ChairId = chairId,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Price = 100
        });

        await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
            {
                PatientId = patientId,
                ChairId = chairId,
                ScheduledDateTime = scheduledAt.AddMinutes(15),
                DurationMinutes = 30,
                Price = 100
            });
        });
    }

    [Fact]
    public async Task Should_Allow_Same_Time_Different_Chair_And_Different_Doctor()
    {
        var patientId = await CreateTestPatientAsync();
        var chairA = await CreateTestChairAsync("Ghế A");
        var chairB = await CreateTestChairAsync("Ghế B");
        var doctorA = await CreateTestDoctorAsync("doctor.chairA");
        var doctorB = await CreateTestDoctorAsync("doctor.chairB");
        var scheduledAt = new DateTime(2030, 4, 11, 9, 0, 0);

        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ChairId = chairA,
            DoctorId = doctorA,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Price = 100
        });

        var second = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ChairId = chairB,
            DoctorId = doctorB,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Price = 100
        });

        second.Id.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task Should_Not_Allow_DoubleBooking_Same_Chair_Even_With_Different_Doctor()
    {
        var patientId = await CreateTestPatientAsync();
        var chairId = await CreateTestChairAsync("Ghế chung");
        var doctorA = await CreateTestDoctorAsync("doctor.shared.chair.a");
        var doctorB = await CreateTestDoctorAsync("doctor.shared.chair.b");
        var scheduledAt = new DateTime(2030, 4, 12, 9, 0, 0);

        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ChairId = chairId,
            DoctorId = doctorA,
            ScheduledDateTime = scheduledAt,
            DurationMinutes = 30,
            Price = 100
        });

        await Should.ThrowAsync<BusinessException>(async () =>
        {
            await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
            {
                PatientId = patientId,
                ChairId = chairId,
                DoctorId = doctorB,
                ScheduledDateTime = scheduledAt,
                DurationMinutes = 30,
                Price = 100
            });
        });
    }

    [Fact]
    public async Task Should_Filter_By_ServiceId_And_ChairId()
    {
        var patientId = await CreateTestPatientAsync();
        var serviceId = await CreateTestServiceAsync("Dịch vụ filter test");
        var chairId = await CreateTestChairAsync("Ghế filter test");

        var matching = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ServiceId = serviceId,
            ChairId = chairId,
            ScheduledDateTime = new DateTime(2030, 5, 1, 9, 0, 0),
            DurationMinutes = 30,
            Price = 100
        });
        await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = new DateTime(2030, 5, 2, 9, 0, 0),
            DurationMinutes = 30,
            Price = 100
        });

        var byService = await _appointmentAppService.GetListAsync(new GetAppointmentListDto { ServiceId = serviceId });
        byService.Items.ShouldContain(x => x.Id == matching.Id);
        byService.Items.Count.ShouldBe(1);

        var byChair = await _appointmentAppService.GetListAsync(new GetAppointmentListDto { ChairId = chairId });
        byChair.Items.ShouldContain(x => x.Id == matching.Id);
        byChair.Items.Count.ShouldBe(1);
    }

    [Fact]
    public async Task Should_Filter_By_PaymentStatus()
    {
        var patientId = await CreateTestPatientAsync();

        var unpaid = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = new DateTime(2030, 5, 3, 9, 0, 0),
            DurationMinutes = 30,
            Price = 100
        });
        var paid = await _appointmentAppService.CreateAsync(new CreateUpdateAppointmentDto
        {
            PatientId = patientId,
            ScheduledDateTime = new DateTime(2030, 5, 4, 9, 0, 0),
            DurationMinutes = 30,
            Price = 100
        });
        await _appointmentAppService.AddPaymentAsync(paid.Id, new CreatePaymentDto
        {
            Amount = 100,
            PaymentDate = DateTime.UtcNow,
            Method = PaymentMethod.Cash
        });

        var result = await _appointmentAppService.GetListAsync(new GetAppointmentListDto { PaymentStatus = PaymentStatus.Paid });

        result.Items.ShouldContain(x => x.Id == paid.Id);
        result.Items.ShouldNotContain(x => x.Id == unpaid.Id);
    }
}
