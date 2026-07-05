using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GiapTech.Dentify.Application.Contracts.Patients;
using GiapTech.Dentify.Patients;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace GiapTech.Dentify.Web.Pages.Patients;

public class EditModalModel : DentifyPageModel
{
    [BindProperty]
    public Guid Id { get; set; }

    [BindProperty]
    public CreateUpdatePatientDto Patient { get; set; } = new();

    [BindProperty]
    public string? TagsText { get; set; }

    public List<SelectListItem> Genders { get; set; } = new();

    private readonly IPatientAppService _patientAppService;

    public EditModalModel(IPatientAppService patientAppService)
    {
        _patientAppService = patientAppService;
    }

    public async Task OnGetAsync(Guid id)
    {
        Id = id;
        Genders = BuildGenderSelectItems();

        var patientDto = await _patientAppService.GetAsync(id);
        Patient = new CreateUpdatePatientDto
        {
            FullName = patientDto.FullName,
            DateOfBirth = patientDto.DateOfBirth,
            Gender = patientDto.Gender,
            PhoneNumber = patientDto.PhoneNumber,
            Email = patientDto.Email,
            Address = patientDto.Address,
            Notes = patientDto.Notes,
            Tags = patientDto.Tags
        };
        TagsText = string.Join(", ", patientDto.Tags);
    }

    public async Task<IActionResult> OnPostAsync()
    {
        Patient.Tags = SplitTags(TagsText);

        await _patientAppService.UpdateAsync(Id, Patient);

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
