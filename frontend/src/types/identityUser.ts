export interface IdentityUserDto {
  id: string
  userName: string
  name?: string | null
  surname?: string | null
  email?: string | null
  phoneNumber?: string | null
  isActive: boolean
  lockoutEnabled: boolean
  roleNames?: string[]
}

export interface CreateIdentityUserDto {
  userName: string
  name?: string | null
  surname?: string | null
  email: string
  phoneNumber?: string | null
  isActive: boolean
  lockoutEnabled: boolean
  password: string
  roleNames: string[]
}

export interface UpdateIdentityUserDto {
  userName: string
  name?: string | null
  surname?: string | null
  email: string
  phoneNumber?: string | null
  isActive: boolean
  lockoutEnabled: boolean
  password?: string | null
  roleNames: string[]
}

export interface IdentityRoleDto {
  id: string
  name: string
  isDefault: boolean
  isStatic: boolean
  isPublic: boolean
}

export interface GetIdentityUsersRequest {
  filter?: string
  sorting?: string
  skipCount?: number
  maxResultCount?: number
}
