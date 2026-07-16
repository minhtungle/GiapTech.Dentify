using System;
using System.ComponentModel.DataAnnotations;
using GiapTech.Dentify.Supplies;

namespace GiapTech.Dentify.Application.Contracts.Supplies;

public class CreateSupplyUsageDto
{
    [Required]
    public Guid SupplyId { get; set; }

    [Range(0.0001, double.MaxValue)]
    public decimal Quantity { get; set; }

    public Guid? AppointmentId { get; set; }

    [Required]
    public DateTime UsedAt { get; set; }

    [StringLength(SupplyUsageConsts.MaxNotesLength)]
    public string? Notes { get; set; }
}
