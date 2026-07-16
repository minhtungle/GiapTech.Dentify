export interface DrugDto {
  id: string
  name: string
  defaultDosage?: string | null
  isActive: boolean
}

export interface CreateUpdateDrugDto {
  name: string
  defaultDosage?: string | null
}
