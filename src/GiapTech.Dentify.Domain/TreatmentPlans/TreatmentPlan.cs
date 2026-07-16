using System;
using System.Collections.Generic;
using System.Linq;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.TreatmentPlans;

public class TreatmentPlan : FullAuditedAggregateRoot<Guid>
{
    public Guid PatientId { get; private set; }
    public string Title { get; private set; } = null!;
    public string? Notes { get; private set; }
    public TreatmentPlanStatus Status { get; private set; }

    private readonly List<TreatmentPlanItem> _items = new();
    public IReadOnlyList<TreatmentPlanItem> Items => _items;

    protected TreatmentPlan()
    {
    }

    public TreatmentPlan(Guid id, Guid patientId, string title, string? notes = null)
        : base(id)
    {
        PatientId = patientId;
        SetTitle(title);
        SetNotes(notes);
        Status = TreatmentPlanStatus.Draft;
    }

    public void SetTitle(string title)
    {
        Title = Check.Length(
            Check.NotNullOrWhiteSpace(title, nameof(title))!,
            nameof(title),
            TreatmentPlanConsts.MaxTitleLength)!;
    }

    public void SetNotes(string? notes)
    {
        Notes = Check.Length(notes, nameof(notes), TreatmentPlanConsts.MaxNotesLength);
    }

    public void ChangeStatus(TreatmentPlanStatus status)
    {
        Status = status;
    }

    public TreatmentPlanItem AddItem(Guid id, int stepOrder, string description, decimal estimatedCost, Guid? serviceId = null)
    {
        var item = new TreatmentPlanItem(id, Id, stepOrder, description, estimatedCost, serviceId);
        _items.Add(item);
        return item;
    }

    public void UpdateItem(Guid itemId, int stepOrder, string description, decimal estimatedCost, Guid? serviceId)
    {
        var item = GetItem(itemId);
        item.SetStepOrder(stepOrder);
        item.SetDescription(description);
        item.SetEstimatedCost(estimatedCost);
        item.SetServiceId(serviceId);
    }

    public void RemoveItem(Guid itemId)
    {
        var item = GetItem(itemId);
        _items.Remove(item);
    }

    public void ChangeItemStatus(Guid itemId, TreatmentPlanItemStatus status)
    {
        GetItem(itemId).ChangeStatus(status);
    }

    public void LinkItemToAppointment(Guid itemId, Guid? appointmentId)
    {
        GetItem(itemId).LinkToAppointment(appointmentId);
    }

    private TreatmentPlanItem GetItem(Guid itemId)
    {
        return _items.SingleOrDefault(x => x.Id == itemId)
            ?? throw new BusinessException(DentifyDomainErrorCodes.TreatmentPlanItemNotFound);
    }
}
