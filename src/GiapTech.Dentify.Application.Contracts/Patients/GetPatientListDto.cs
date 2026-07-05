using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Patients;

public class GetPatientListDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public string? Tag { get; set; }
}
