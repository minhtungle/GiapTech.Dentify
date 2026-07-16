import { api } from "./api"
import type { PagedResultDto } from "@/types/common"
import type {
  CreateUpdatePatientDto,
  GetPatientListRequest,
  LinkPatientIdentityUserDto,
  PatientDetailDto,
  PatientDto,
  RecallPatientDto,
} from "@/types/patient"

const BASE = "/api/app/patient"

export const patientsApi = {
  getList: (params: GetPatientListRequest) =>
    api.get<PagedResultDto<PatientDto>>(BASE, params),
  get: (id: string) => api.get<PatientDto>(`${BASE}/${id}`),
  getDetail: (id: string) =>
    api.get<PatientDetailDto>(`${BASE}/${id}/patient-detail`),
  getRecallList: (monthsThreshold: number) =>
    api.get<RecallPatientDto[]>(`${BASE}/recall-list`, { monthsThreshold }),
  getDuplicates: (fullName: string, phoneNumber?: string | null, excludeId?: string) =>
    api.get<PatientDto[]>(`${BASE}/duplicates`, {
      fullName,
      phoneNumber: phoneNumber ?? undefined,
      excludeId,
    }),
  create: (input: CreateUpdatePatientDto) => api.post<PatientDto>(BASE, input),
  update: (id: string, input: CreateUpdatePatientDto) =>
    api.put<PatientDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
  linkIdentityUser: (id: string, input: LinkPatientIdentityUserDto) =>
    api.post<PatientDto>(`${BASE}/${id}/link-identity-user`, input),
  unlinkIdentityUser: (id: string) =>
    api.post<PatientDto>(`${BASE}/${id}/unlink-identity-user`),
}
