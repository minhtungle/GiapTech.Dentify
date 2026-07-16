import { api } from "./api"
import type {
  InsurancePolicyDto,
  CreateUpdateInsurancePolicyDto,
} from "@/types/insurancePolicy"

const BASE = "/api/app/insurance-policy"

export const insurancePoliciesApi = {
  getList: (patientId: string) =>
    api.get<InsurancePolicyDto[]>(BASE, { patientId }),
  create: (input: CreateUpdateInsurancePolicyDto) =>
    api.post<InsurancePolicyDto>(BASE, input),
  update: (id: string, input: CreateUpdateInsurancePolicyDto) =>
    api.put<InsurancePolicyDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
}
