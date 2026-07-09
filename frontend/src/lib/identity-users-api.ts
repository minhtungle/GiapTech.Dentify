import { api } from "./api"
import type { ListResultDto, PagedResultDto } from "@/types/common"
import type {
  CreateIdentityUserDto,
  GetIdentityUsersRequest,
  IdentityRoleDto,
  IdentityUserDto,
  UpdateIdentityUserDto,
} from "@/types/identityUser"

const BASE = "/api/identity/users"

export const identityUsersApi = {
  search: async (filter: string): Promise<IdentityUserDto[]> => {
    const result = await api.get<PagedResultDto<IdentityUserDto>>(BASE, {
      filter,
      maxResultCount: 20,
    })
    return result.items
  },
  getList: (params: GetIdentityUsersRequest) =>
    api.get<PagedResultDto<IdentityUserDto>>(BASE, params),
  get: (id: string) => api.get<IdentityUserDto>(`${BASE}/${id}`),
  create: (input: CreateIdentityUserDto) =>
    api.post<IdentityUserDto>(BASE, input),
  update: (id: string, input: UpdateIdentityUserDto) =>
    api.put<IdentityUserDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
  getRoles: (id: string) =>
    api.get<ListResultDto<IdentityRoleDto>>(`${BASE}/${id}/roles`),
  updateRoles: (id: string, roleNames: string[]) =>
    api.put<void>(`${BASE}/${id}/roles`, { roleNames }),
  getAssignableRoles: () =>
    api.get<ListResultDto<IdentityRoleDto>>(`${BASE}/assignable-roles`),
}
