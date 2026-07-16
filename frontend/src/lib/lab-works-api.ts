import { api } from "./api"
import type { PagedResultDto } from "@/types/common"
import type {
  CreateUpdateLabWorkDto,
  GetLabWorkListRequest,
  LabWorkDto,
  UpdateLabWorkStatusDto,
} from "@/types/labWork"

const BASE = "/api/app/lab-work"

export const labWorksApi = {
  getList: (params: GetLabWorkListRequest) =>
    api.get<PagedResultDto<LabWorkDto>>(BASE, params),
  get: (id: string) => api.get<LabWorkDto>(`${BASE}/${id}`),
  getBoard: () => api.get<LabWorkDto[]>(`${BASE}/board`),
  create: (input: CreateUpdateLabWorkDto) => api.post<LabWorkDto>(BASE, input),
  update: (id: string, input: CreateUpdateLabWorkDto) =>
    api.put<LabWorkDto>(`${BASE}/${id}`, input),
  updateStatus: (id: string, input: UpdateLabWorkStatusDto) =>
    api.put<LabWorkDto>(`${BASE}/${id}/status`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
}
