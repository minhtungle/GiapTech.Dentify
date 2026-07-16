import { api } from "./api"
import type { DrugDto, CreateUpdateDrugDto } from "@/types/drug"

const BASE = "/api/app/drug"

export const drugsApi = {
  get: (id: string) => api.get<DrugDto>(`${BASE}/${id}`),
  getActiveList: () => api.get<DrugDto[]>(`${BASE}/active-list`),
  create: (input: CreateUpdateDrugDto) => api.post<DrugDto>(BASE, input),
  update: (id: string, input: CreateUpdateDrugDto) =>
    api.put<DrugDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
  activate: (id: string) => api.post<void>(`${BASE}/${id}/activate`),
  deactivate: (id: string) => api.post<void>(`${BASE}/${id}/deactivate`),
}
