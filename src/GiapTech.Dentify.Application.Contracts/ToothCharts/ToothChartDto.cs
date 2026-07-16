using System;
using System.Collections.Generic;

namespace GiapTech.Dentify.Application.Contracts.ToothCharts;

public class ToothChartDto
{
    public Guid PatientId { get; set; }
    public bool IsChildPatient { get; set; }
    public List<ToothRecordDto> Records { get; set; } = new();
}
