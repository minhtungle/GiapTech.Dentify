using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Waitlist;

namespace GiapTech.Dentify.Application.Contracts.Waitlist;

public class CreateUpdateWaitlistEntryDto
{
    [Required]
    public Guid PatientId { get; set; }

    public Guid? DoctorId { get; set; }

    public Guid? ServiceId { get; set; }

    [StringLength(WaitlistEntryConsts.MaxPreferredTimeNoteLength)]
    public string? PreferredTimeNote { get; set; }

    [StringLength(WaitlistEntryConsts.MaxNotesLength)]
    public string? Notes { get; set; }
}
