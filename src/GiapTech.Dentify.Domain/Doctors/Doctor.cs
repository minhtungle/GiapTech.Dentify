using System;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace GiapTech.Dentify.Doctors;

public class Doctor : FullAuditedAggregateRoot<Guid>
{
    public Guid IdentityUserId { get; private set; }
    public string? Specialization { get; private set; }
    public bool IsActive { get; private set; }

    protected Doctor()
    {
    }

    public Doctor(Guid id, Guid identityUserId, string? specialization = null)
        : base(id)
    {
        IdentityUserId = identityUserId;
        SetSpecialization(specialization);
        IsActive = true;
    }

    public void SetSpecialization(string? specialization)
    {
        Specialization = Check.Length(specialization, nameof(specialization), DoctorConsts.MaxSpecializationLength);
    }

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}
