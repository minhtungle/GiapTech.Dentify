// Wire format: the backend serializes C# enums as their numeric ordinal in responses.
export const MedicalTermCategory = {
  Allergy: 0,
  MedicalCondition: 1,
  Tag: 2,
} as const
export type MedicalTermCategory = (typeof MedicalTermCategory)[keyof typeof MedicalTermCategory]

// Requests accept the enum member name as a string.
export type MedicalTermCategoryName = "Allergy" | "MedicalCondition" | "Tag"

export interface MedicalTermDto {
  id: string
  name: string
  category: MedicalTermCategory
  isActive: boolean
}

export interface CreateUpdateMedicalTermDto {
  name: string
  category: MedicalTermCategoryName
}
