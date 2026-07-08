import type { ToothNotationSystemName } from "@/lib/toothNotation"

export interface ClinicSettingsDto {
  name: string
  address?: string | null
  phoneNumber?: string | null
  logoUrl?: string | null
  hasUploadedLogo: boolean
  toothNotationSystem: ToothNotationSystemName
}

export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024
export const ALLOWED_LOGO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const TOOTH_NOTATION_SYSTEM_NAMES: ToothNotationSystemName[] = [
  "Iso3950",
  "Palmer",
  "Universal",
]

export const TOOTH_NOTATION_SYSTEM_LABELS_VI: Record<ToothNotationSystemName, string> = {
  Iso3950: "ISO 3950 (FDI)",
  Palmer: "Palmer",
  Universal: "Universal",
}

export interface UpdateClinicSettingsDto {
  name: string
  address?: string | null
  phoneNumber?: string | null
  logoUrl?: string | null
  toothNotationSystem: ToothNotationSystemName
}
