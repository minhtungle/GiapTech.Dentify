using System.Collections.Generic;
using System.Linq;

namespace GiapTech.Dentify.ToothCharts;

/// <summary>
/// Tooth numbers use ISO 3950 notation as the single canonical representation everywhere
/// in the backend. Palmer/Universal are display-only conversions done in the frontend.
/// </summary>
public static class ToothNumbers
{
    public static readonly IReadOnlyList<int> Permanent = Quadrants(1, 2, 3, 4);

    public static readonly IReadOnlyList<int> Primary = Quadrants(5, 6, 7, 8);

    public static bool IsValid(int toothNumber)
    {
        return Permanent.Contains(toothNumber) || Primary.Contains(toothNumber);
    }

    public static IReadOnlyList<int> GetNumbersFor(bool isChildPatient)
    {
        return isChildPatient ? Primary : Permanent;
    }

    private static IReadOnlyList<int> Quadrants(int q1, int q2, int q3, int q4)
    {
        var maxPerQuadrant = q1 <= 4 ? 8 : 5;
        var numbers = new List<int>();
        foreach (var quadrant in new[] { q1, q2, q3, q4 })
        {
            for (var position = 1; position <= maxPerQuadrant; position++)
            {
                numbers.Add((quadrant * 10) + position);
            }
        }
        return numbers;
    }
}
