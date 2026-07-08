using System;
using Volo.Abp.Application.Dtos;

namespace GiapTech.Dentify.Application.Contracts.Supplies;

public class GetSupplyUsageListDto : PagedAndSortedResultRequestDto
{
    public Guid? SupplyId { get; set; }
    public Guid? AppointmentId { get; set; }
}
