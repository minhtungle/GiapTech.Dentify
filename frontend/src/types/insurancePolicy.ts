export interface InsurancePolicyDto {
  id: string
  patientId: string
  providerName: string
  policyNumber: string
  effectiveDate: string
  expiryDate?: string | null
  notes?: string | null
  creationTime: string
}

export interface CreateUpdateInsurancePolicyDto {
  patientId: string
  providerName: string
  policyNumber: string
  effectiveDate: string
  expiryDate?: string | null
  notes?: string | null
}
