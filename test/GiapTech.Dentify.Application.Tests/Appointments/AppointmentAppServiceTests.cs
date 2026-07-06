using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Appointments;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Modularity;
using Xunit;

namespace GiapTech.Dentify.Appointments;

public abstract class AppointmentAppServiceTests<TStartupModule> : DentifyApplicationTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{
    private readonly IAppointmentAppService _appointmentAppService;
    private readonly IPatientAppService _patientAppService;

    protected AppointmentAppServiceTests()
    {
        _appointmentAppService = GetRequiredService<IAppointmentAppService>();
        _patientAppService = GetRequiredService<IPatientAppService>();
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

        var partiallyPaid = await _appointmentAppService.UpdatePaymentAsync(appointment.Id, new UpdatePaymentDto { PaidAmount = 400 });
        partiallyPaid.PaymentStatus.ShouldBe(PaymentStatus.PartiallyPaid);

        var fullyPaid = await _appointmentAppService.UpdatePaymentAsync(appointment.Id, new UpdatePaymentDto { PaidAmount = 1000 });
        fullyPaid.PaymentStatus.ShouldBe(PaymentStatus.Paid);
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
            await _appointmentAppService.UpdatePaymentAsync(appointment.Id, new UpdatePaymentDto { PaidAmount = 200 });
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
}
