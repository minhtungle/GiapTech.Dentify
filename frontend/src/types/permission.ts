export interface PermissionGrantInfoDto {
  name: string
  displayName?: string | null
  parentName?: string | null
  isGranted: boolean
  allowedProviders?: string[]
  grantedProviders?: { providerName: string; providerKey?: string | null }[]
  isEditable: boolean
}

export interface PermissionGroupDto {
  name: string
  displayName?: string | null
  permissions: PermissionGrantInfoDto[]
}

export interface GetPermissionListResultDto {
  entityDisplayName?: string | null
  groups: PermissionGroupDto[]
}

export interface UpdatePermissionDto {
  name: string
  isGranted: boolean
}
