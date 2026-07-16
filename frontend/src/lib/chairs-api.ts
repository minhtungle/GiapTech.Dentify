import { api } from "./api"
import type { ChairDto, CreateUpdateChairDto } from "@/types/chair"

const BASE = "/api/app/chair"

export const chairsApi = {
  get: (id: string) => api.get<ChairDto>(`${BASE}/${id}`),
  getActiveList: () => api.get<ChairDto[]>(`${BASE}/active-list`),
  create: (input: CreateUpdateChairDto) => api.post<ChairDto>(BASE, input),
  update: (id: string, input: CreateUpdateChairDto) =>
    api.put<ChairDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
  activate: (id: string) => api.post<void>(`${BASE}/${id}/activate`),
  deactivate: (id: string) => api.post<void>(`${BASE}/${id}/deactivate`),
}
