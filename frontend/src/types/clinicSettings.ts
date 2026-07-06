export interface ClinicSettingsDto {
  name: string
  address?: string | null
  phoneNumber?: string | null
  logoUrl?: string | null
}

export interface UpdateClinicSettingsDto {
  name: string
  address?: string | null
  phoneNumber?: string | null
  logoUrl?: string | null
}
