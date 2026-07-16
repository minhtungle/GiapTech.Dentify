import { api } from "./api"
import type { PagedResultDto } from "@/types/common"
import type {
  CreateUpdateTaskItemDto,
  GetTaskItemListRequest,
  TaskItemDto,
} from "@/types/task"

const BASE = "/api/app/task-item"

export const tasksApi = {
  getList: (params: GetTaskItemListRequest) =>
    api.get<PagedResultDto<TaskItemDto>>(BASE, params),
  get: (id: string) => api.get<TaskItemDto>(`${BASE}/${id}`),
  getOverview: () => api.get<TaskItemDto[]>(`${BASE}/overview-list`),
  create: (input: CreateUpdateTaskItemDto) => api.post<TaskItemDto>(BASE, input),
  update: (id: string, input: CreateUpdateTaskItemDto) =>
    api.put<TaskItemDto>(`${BASE}/${id}`, input),
  toggleDone: (id: string) => api.post<TaskItemDto>(`${BASE}/${id}/toggle-done`),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
}
