import { api } from "./api"
import type { PagedResultDto } from "@/types/common"
import type {
  WaitlistEntryDto,
  CreateUpdateWaitlistEntryDto,
  ChangeWaitlistEntryStatusDto,
  GetWaitlistEntryListRequest,
} from "@/types/waitlist"

const BASE = "/api/app/waitlist-entry"

export const waitlistApi = {
  get: (id: string) => api.get<WaitlistEntryDto>(`${BASE}/${id}`),
  getList: (params: GetWaitlistEntryListRequest) =>
    api.get<PagedResultDto<WaitlistEntryDto>>(BASE, params),
  create: (input: CreateUpdateWaitlistEntryDto) =>
    api.post<WaitlistEntryDto>(BASE, input),
  update: (id: string, input: CreateUpdateWaitlistEntryDto) =>
    api.put<WaitlistEntryDto>(`${BASE}/${id}`, input),
  changeStatus: (id: string, input: ChangeWaitlistEntryStatusDto) =>
    api.post<WaitlistEntryDto>(`${BASE}/${id}/change-status`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
}
