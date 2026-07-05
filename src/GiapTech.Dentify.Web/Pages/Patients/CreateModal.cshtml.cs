using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace GiapTech.Dentify.Web.Pages.Patients;

public class CreateModalModel : DentifyPageModel
{
    [BindProperty]
    public CreateUpdatePatientDto Patient { get; set; } = new();

    [BindProperty]
    public string? TagsText { get; set; }

    public List<SelectListItem> Genders { get; set; } = new();

    private readonly IPatientAppService _patientAppService;

    public CreateModalModel(IPatientAppService patientAppService)
    {
        _patientAppService = patientAppService;
    }

    public void OnGet()
    {
        Genders = BuildGenderSelectItems();
    }

    public async Task<IActionResult> OnPostAsync()
    {
        Patient.Tags = SplitTags(TagsText);

        await _patientAppService.CreateAsync(Patient);

        return NoContent();
    }

    private List<SelectListItem> BuildGenderSelectItems()
    {
        return Enum.GetValues<Gender>()
            .Select(gender => new SelectListItem(L[$"Gender:{gender}"].Value, gender.ToString()))
            .ToList();
    }

    private static List<string> SplitTags(string? tagsText)
    {
        if (string.IsNullOrWhiteSpace(tagsText))
        {
            return new List<string>();
        }

        return tagsText
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .ToList();
    }
}
