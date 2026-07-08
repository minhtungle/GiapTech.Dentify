import { api } from "./api"
import type { PagedResultDto } from "@/types/common"
import type { IdentityUserDto } from "@/types/identityUser"

const BASE = "/api/identity/users"

export const identityUsersApi = {
  search: async (filter: string): Promise<IdentityUserDto[]> => {
    const result = await api.get<PagedResultDto<IdentityUserDto>>(BASE, {
      filter,
      maxResultCount: 20,
    })
    return result.items
  },
}
