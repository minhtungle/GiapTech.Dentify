import type { PagedAndSortedRequest } from "./common"

// Wire format: the backend serializes C# enums as their numeric ordinal in responses.
export const Gender = {
  Male: 0,
  Female: 1,
  Other: 2,
} as const
export type Gender = (typeof Gender)[keyof typeof Gender]

export const GENDER_LABELS_VI: Record<Gender, string> = {
  [Gender.Male]: "Nam",
  [Gender.Female]: "Nữ",
  [Gender.Other]: "Khác",
}

// Requests accept the enum member name as a string.
export type GenderName = "Male" | "Female" | "Other"

export interface PatientDto {
  id: string
  fullName: string
  dateOfBirth: string
  gender: Gender
  phoneNumber?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  referralSource?: string | null
  identityUserId?: string | null
  tags: string[]
  allergies: string[]
  medicalConditions: string[]
  isChildPatient: boolean
  creationTime: string
}

export interface LinkPatientIdentityUserDto {
  identityUserId: string
}

export interface PatientDetailDto {
  patient: PatientDto
  lastAppointmentDate?: string | null
  totalDebt: number
  noShowCount: number
}

export interface RecallPatientDto {
  patientId: string
  fullName: string
  phoneNumber?: string | null
  lastCompletedDate: string
}

export interface CreateUpdatePatientDto {
  fullName: string
  dateOfBirth: string
  gender: GenderName
  phoneNumber?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  referralSource?: string | null
  tags: string[]
  allergies: string[]
  medicalConditions: string[]
}

export interface GetPatientListRequest extends PagedAndSortedRequest {
  filter?: string
  tag?: string
}
