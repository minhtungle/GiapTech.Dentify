import { api } from "./api"
import type { ServiceDto, CreateUpdateServiceDto } from "@/types/service"

const BASE = "/api/app/service"

export const servicesApi = {
  get: (id: string) => api.get<ServiceDto>(`${BASE}/${id}`),
  getActiveList: () => api.get<ServiceDto[]>(`${BASE}/active-list`),
  create: (input: CreateUpdateServiceDto) => api.post<ServiceDto>(BASE, input),
  update: (id: string, input: CreateUpdateServiceDto) =>
    api.put<ServiceDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
  activate: (id: string) => api.post<void>(`${BASE}/${id}/activate`),
  deactivate: (id: string) => api.post<void>(`${BASE}/${id}/deactivate`),
}
