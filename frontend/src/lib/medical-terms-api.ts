import { api } from "./api"
import type {
  CreateUpdateMedicalTermDto,
  MedicalTermCategoryName,
  MedicalTermDto,
} from "@/types/medicalTerm"

const BASE = "/api/app/medical-term"

export const medicalTermsApi = {
  get: (id: string) => api.get<MedicalTermDto>(`${BASE}/${id}`),
  getActiveList: (category: MedicalTermCategoryName) =>
    api.get<MedicalTermDto[]>(`${BASE}/active-list`, { category }),
  create: (input: CreateUpdateMedicalTermDto) => api.post<MedicalTermDto>(BASE, input),
  update: (id: string, input: CreateUpdateMedicalTermDto) =>
    api.put<MedicalTermDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
  activate: (id: string) => api.post<void>(`${BASE}/${id}/activate`),
  deactivate: (id: string) => api.post<void>(`${BASE}/${id}/deactivate`),
}
