import { api } from "./api"
import type { GetPermissionListResultDto, UpdatePermissionDto } from "@/types/permission"

const BASE = "/api/permission-management/permissions"

export const permissionsApi = {
  getForRole: (roleName: string) =>
    api.get<GetPermissionListResultDto>(BASE, {
      providerName: "R",
      providerKey: roleName,
    }),
  updateForRole: (roleName: string, permissions: UpdatePermissionDto[]) =>
    api.put<void>(`${BASE}?providerName=R&providerKey=${encodeURIComponent(roleName)}`, {
      permissions,
    }),
}
