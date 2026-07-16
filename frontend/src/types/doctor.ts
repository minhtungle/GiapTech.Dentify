export interface DoctorDto {
  id: string
  identityUserId: string
  fullName: string
  specialization?: string | null
  isActive: boolean
}

export interface CreateUpdateDoctorDto {
  identityUserId: string
  specialization?: string | null
}
