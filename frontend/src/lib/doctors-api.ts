import { api } from "./api"
import type { DoctorDto, CreateUpdateDoctorDto } from "@/types/doctor"

const BASE = "/api/app/doctor"

export const doctorsApi = {
  get: (id: string) => api.get<DoctorDto>(`${BASE}/${id}`),
  getActiveList: () => api.get<DoctorDto[]>(`${BASE}/active-list`),
  create: (input: CreateUpdateDoctorDto) => api.post<DoctorDto>(BASE, input),
  update: (id: string, input: CreateUpdateDoctorDto) =>
    api.put<DoctorDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
  activate: (id: string) => api.post<void>(`${BASE}/${id}/activate`),
  deactivate: (id: string) => api.post<void>(`${BASE}/${id}/deactivate`),
}
