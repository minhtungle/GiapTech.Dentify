using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Waitlist;

public class WaitlistEntry : FullAuditedAggregateRoot<Guid>
{
    public Guid PatientId { get; private set; }
    public Guid? DoctorId { get; private set; }
    public Guid? ServiceId { get; private set; }
    public string? PreferredTimeNote { get; private set; }
    public string? Notes { get; private set; }
    public WaitlistStatus Status { get; private set; }

    protected WaitlistEntry()
    {
    }

    public WaitlistEntry(
        Guid id,
        Guid patientId,
        Guid? doctorId = null,
        Guid? serviceId = null,
        string? preferredTimeNote = null,
        string? notes = null)
        : base(id)
    {
        PatientId = patientId;
        DoctorId = doctorId;
        ServiceId = serviceId;
        SetPreferredTimeNote(preferredTimeNote);
        SetNotes(notes);
        Status = WaitlistStatus.Waiting;
    }

    public void UpdateDetails(Guid patientId, Guid? doctorId, Guid? serviceId, string? preferredTimeNote, string? notes)
    {
        PatientId = patientId;
        DoctorId = doctorId;
        ServiceId = serviceId;
        SetPreferredTimeNote(preferredTimeNote);
        SetNotes(notes);
    }

    public void SetPreferredTimeNote(string? preferredTimeNote)
    {
        PreferredTimeNote = Check.Length(preferredTimeNote, nameof(preferredTimeNote), WaitlistEntryConsts.MaxPreferredTimeNoteLength);
    }

    public void SetNotes(string? notes)
    {
        Notes = Check.Length(notes, nameof(notes), WaitlistEntryConsts.MaxNotesLength);
    }

    public void ChangeStatus(WaitlistStatus status)
    {
        Status = status;
    }
}
