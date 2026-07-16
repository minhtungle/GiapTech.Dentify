export type ToothNotationSystemName = "Iso3950" | "Palmer" | "Universal"

const PALMER_QUADRANT_SYMBOL: Record<number, string> = {
  1: "⏌",
  2: "⏋",
  3: "⎿",
  4: "⎾",
  5: "⏌",
  6: "⏋",
  7: "⎿",
  8: "⎾",
}

// FDI/ISO 3950: quadrant (1-8) is the tens digit, position within the
// quadrant (1-8) is the units digit — e.g. 26 = quadrant 2, position 6.
function splitIso(iso: number): { quadrant: number; position: number } {
  return { quadrant: Math.floor(iso / 10), position: iso % 10 }
}

export function toPalmer(iso: number): string {
  const { quadrant, position } = splitIso(iso)
  const symbol = PALMER_QUADRANT_SYMBOL[quadrant] ?? ""
  return `${position}${symbol}`
}

// Universal numbering: permanent teeth are numbered 1-32 starting at the
// upper-right third molar going clockwise; primary teeth are lettered A-T
// the same way. Quadrants 1/2 = upper right/left, 3/4 = lower left/right
// (permanent); 5/6 = upper right/left, 7/8 = lower left/right (primary).
const PERMANENT_UNIVERSAL_BY_ISO: Record<number, number> = {}
{
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]
  const lowerLeft = [38, 37, 36, 35, 34, 33, 32, 31]
  const lowerRight = [41, 42, 43, 44, 45, 46, 47, 48]
  ;[...upperRight, ...upperLeft, ...lowerLeft, ...lowerRight].forEach((iso, index) => {
    PERMANENT_UNIVERSAL_BY_ISO[iso] = index + 1
  })
}

const PRIMARY_UNIVERSAL_BY_ISO: Record<number, string> = {}
{
  const upperRight = [55, 54, 53, 52, 51]
  const upperLeft = [61, 62, 63, 64, 65]
  const lowerLeft = [75, 74, 73, 72, 71]
  const lowerRight = [81, 82, 83, 84, 85]
  const letters = "ABCDEFGHIJKLMNOPQRST"
  ;[...upperRight, ...upperLeft, ...lowerLeft, ...lowerRight].forEach((iso, index) => {
    PRIMARY_UNIVERSAL_BY_ISO[iso] = letters[index]
  })
}

export function toUniversal(iso: number): string {
  const permanent = PERMANENT_UNIVERSAL_BY_ISO[iso]
  if (permanent !== undefined) return String(permanent)
  const primary = PRIMARY_UNIVERSAL_BY_ISO[iso]
  return primary ?? String(iso)
}

export function formatToothNumber(iso: number, system: ToothNotationSystemName): string {
  switch (system) {
    case "Palmer":
      return toPalmer(iso)
    case "Universal":
      return toUniversal(iso)
    default:
      return String(iso)
  }
}
