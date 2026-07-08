import { api } from "./api"
import type { PagedResultDto } from "@/types/common"
import type {
  SupplyDto,
  CreateUpdateSupplyDto,
  RestockSupplyDto,
  SupplyUsageDto,
  CreateSupplyUsageDto,
  GetSupplyUsageListRequest,
} from "@/types/supply"

const BASE = "/api/app/supply"
const USAGE_BASE = "/api/app/supply-usage"

export const suppliesApi = {
  get: (id: string) => api.get<SupplyDto>(`${BASE}/${id}`),
  getActiveList: () => api.get<SupplyDto[]>(`${BASE}/active-list`),
  create: (input: CreateUpdateSupplyDto) => api.post<SupplyDto>(BASE, input),
  update: (id: string, input: CreateUpdateSupplyDto) =>
    api.put<SupplyDto>(`${BASE}/${id}`, input),
  restock: (id: string, input: RestockSupplyDto) =>
    api.post<SupplyDto>(`${BASE}/${id}/restock`, input),
  activate: (id: string) => api.post<void>(`${BASE}/${id}/activate`),
  deactivate: (id: string) => api.post<void>(`${BASE}/${id}/deactivate`),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
}

export const supplyUsagesApi = {
  getList: (params: GetSupplyUsageListRequest) =>
    api.get<PagedResultDto<SupplyUsageDto>>(USAGE_BASE, params),
  create: (input: CreateSupplyUsageDto) => api.post<SupplyUsageDto>(USAGE_BASE, input),
  delete: (id: string) => api.delete<void>(`${USAGE_BASE}/${id}`),
}
