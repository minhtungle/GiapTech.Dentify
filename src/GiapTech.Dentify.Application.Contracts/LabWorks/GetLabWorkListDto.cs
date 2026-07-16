using System;
using GiapTech.Dentify.LabWorks;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.LabWorks;

public class GetLabWorkListDto : PagedAndSortedResultRequestDto
{
    public Guid? PatientId { get; set; }
    public LabWorkStatus? Status { get; set; }
}
