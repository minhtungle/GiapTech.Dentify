import { api } from "./api"
import type { PagedResultDto } from "@/types/common"
import type {
  TreatmentPlanDto,
  CreateUpdateTreatmentPlanDto,
  ChangeTreatmentPlanStatusDto,
  ChangeTreatmentPlanItemStatusDto,
  LinkTreatmentPlanItemToAppointmentDto,
  GetTreatmentPlanListRequest,
} from "@/types/treatmentPlan"

const BASE = "/api/app/treatment-plan"

export const treatmentPlansApi = {
  get: (id: string) => api.get<TreatmentPlanDto>(`${BASE}/${id}`),
  getList: (params: GetTreatmentPlanListRequest) =>
    api.get<PagedResultDto<TreatmentPlanDto>>(BASE, params),
  create: (input: CreateUpdateTreatmentPlanDto) =>
    api.post<TreatmentPlanDto>(BASE, input),
  update: (id: string, input: CreateUpdateTreatmentPlanDto) =>
    api.put<TreatmentPlanDto>(`${BASE}/${id}`, input),
  changeStatus: (id: string, input: ChangeTreatmentPlanStatusDto) =>
    api.post<TreatmentPlanDto>(`${BASE}/${id}/change-status`, input),
  changeItemStatus: (id: string, itemId: string, input: ChangeTreatmentPlanItemStatusDto) =>
    api.post<TreatmentPlanDto>(`${BASE}/${id}/change-item-status/${itemId}`, input),
  linkItemToAppointment: (id: string, itemId: string, input: LinkTreatmentPlanItemToAppointmentDto) =>
    api.post<TreatmentPlanDto>(`${BASE}/${id}/link-item-to-appointment/${itemId}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
}
