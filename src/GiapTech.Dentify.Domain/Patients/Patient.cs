using System;
using System.Collections.Generic;
using System.Linq;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Patients;

public class Patient : FullAuditedAggregateRoot<Guid>
{
    public string FullName { get; private set; } = null!;
    public DateTime DateOfBirth { get; private set; }
    public Gender Gender { get; private set; }
    public string? PhoneNumber { get; private set; }
    public string? Email { get; private set; }
    public string? Address { get; private set; }
    public string? Notes { get; private set; }
    public List<string> Tags { get; private set; } = new();

    public bool IsChildPatient => DateOfBirth.Date > DateTime.Today.AddYears(-PatientConsts.ChildPatientMaxAge);

    protected Patient()
    {
    }

    public Patient(Guid id, string fullName, DateTime dateOfBirth, Gender gender)
        : base(id)
    {
        SetFullName(fullName);
        DateOfBirth = dateOfBirth;
        Gender = gender;
    }

    public void SetFullName(string fullName)
    {
        FullName = Check.NotNullOrWhiteSpace(fullName, nameof(fullName), PatientConsts.MaxFullNameLength);
    }

    public void SetDateOfBirth(DateTime dateOfBirth)
    {
        DateOfBirth = dateOfBirth;
    }

    public void SetGender(Gender gender)
    {
        Gender = gender;
    }

    public void SetContactInfo(string? phoneNumber, string? email, string? address)
    {
        PhoneNumber = Check.Length(phoneNumber, nameof(phoneNumber), PatientConsts.MaxPhoneNumberLength);
        Email = Check.Length(email, nameof(email), PatientConsts.MaxEmailLength);
        Address = Check.Length(address, nameof(address), PatientConsts.MaxAddressLength);
    }

    public void SetNotes(string? notes)
    {
        Notes = Check.Length(notes, nameof(notes), PatientConsts.MaxNotesLength);
    }

    public void SetTags(IEnumerable<string> tags)
    {
        var normalizedTags = tags
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(PatientConsts.MaxTagCount)
            .ToList();

        foreach (var tag in normalizedTags)
        {
            Check.Length(tag, nameof(tag), PatientConsts.MaxTagLength);
        }

        Tags = normalizedTags;
    }
}
