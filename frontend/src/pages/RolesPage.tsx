import { useEffect, useState } from "react"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { identityUsersApi } from "@/lib/identity-users-api"
import { permissionsApi } from "@/lib/permissions-api"
import { ApiError } from "@/lib/api"
import { roleDisplayName } from "@/lib/role-labels"
import { cn } from "@/lib/utils"
import type { IdentityRoleDto } from "@/types/identityUser"
import type { PermissionGrantInfoDto, PermissionGroupDto } from "@/types/permission"

export function RolesPage() {
  const [roles, setRoles] = useState<IdentityRoleDto[]>([])
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)

  const [groups, setGroups] = useState<PermissionGroupDto[]>([])
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
  const [changes, setChanges] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadRoles = async () => {
      setIsLoadingRoles(true)
      try {
        const result = await identityUsersApi.getAssignableRoles()
        setRoles(result.items)
        if (result.items.length > 0) {
          setSelectedRole(result.items[0].name)
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách vai trò")
      } finally {
        setIsLoadingRoles(false)
      }
    }
    void loadRoles()
  }, [])

  useEffect(() => {
    if (!selectedRole) return
    const loadPermissions = async () => {
      setIsLoadingPermissions(true)
      setChanges({})
      try {
        const result = await permissionsApi.getForRole(selectedRole)
        setGroups(result.groups.filter((g) => g.permissions.length > 0))
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách quyền")
      } finally {
        setIsLoadingPermissions(false)
      }
    }
    void loadPermissions()
  }, [selectedRole])

  const isGranted = (permission: PermissionGrantInfoDto): boolean =>
    changes[permission.name] ?? permission.isGranted

  const togglePermission = (permission: PermissionGrantInfoDto, value: boolean) => {
    setChanges((prev) => ({ ...prev, [permission.name]: value }))
  }

  const toggleGroup = (group: PermissionGroupDto, value: boolean) => {
    setChanges((prev) => {
      const next = { ...prev }
      for (const permission of group.permissions) {
        if (permission.isEditable) {
          next[permission.name] = value
        }
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!selectedRole) return
    const changedEntries = Object.entries(changes)
    if (changedEntries.length === 0) {
      toast.info("Không có thay đổi nào để lưu")
      return
    }
    setIsSaving(true)
    try {
      await permissionsApi.updateForRole(
        selectedRole,
        changedEntries.map(([name, isGranted]) => ({ name, isGranted })),
      )
      toast.success("Đã lưu quyền cho vai trò")
      setChanges({})
      const result = await permissionsApi.getForRole(selectedRole)
      setGroups(result.groups.filter((g) => g.permissions.length > 0))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Vai trò & phân quyền</h1>
        <p className="text-sm text-muted-foreground">
          Chỉnh quyền cho từng vai trò có sẵn — không tạo vai trò mới ở đây.
        </p>
      </div>

      {isLoadingRoles ? (
        <Skeleton className="h-9 w-full max-w-md" />
      ) : (
        <Tabs value={selectedRole ?? undefined} onValueChange={setSelectedRole}>
          <TabsList>
            {roles.map((role) => (
              <TabsTrigger key={role.id} value={role.name}>
                {roleDisplayName(role.name)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {isLoadingPermissions && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoadingPermissions && groups.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-10 text-muted-foreground">
          <ShieldCheck className="size-8" />
          <p>Không có quyền nào để hiển thị.</p>
        </div>
      )}

      {!isLoadingPermissions && groups.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((group) => {
            const editablePermissions = group.permissions.filter((p) => p.isEditable)
            const allGranted =
              editablePermissions.length > 0 &&
              editablePermissions.every((p) => isGranted(p))
            const parentPermission = group.permissions.find((p) => !p.parentName)
            const childPermissions = group.permissions.filter((p) => p.parentName)

            return (
              <Card key={group.name} className="py-3">
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 py-0">
                  <CardTitle className="text-sm">{group.displayName ?? group.name}</CardTitle>
                  {editablePermissions.length > 1 && (
                    <label className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                      <input
                        type="checkbox"
                        className="size-3.5"
                        checked={allGranted}
                        onChange={(e) => toggleGroup(group, e.target.checked)}
                      />
                      Tất cả
                    </label>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-2 px-4 pt-2 pb-0">
                  {parentPermission && (
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={isGranted(parentPermission)}
                        disabled={!parentPermission.isEditable}
                        onChange={(e) => togglePermission(parentPermission, e.target.checked)}
                      />
                      {parentPermission.displayName ?? parentPermission.name}
                    </label>
                  )}
                  {childPermissions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {childPermissions.map((permission) => {
                        const granted = isGranted(permission)
                        return (
                          <button
                            key={permission.name}
                            type="button"
                            aria-pressed={granted}
                            disabled={!permission.isEditable}
                            onClick={() => togglePermission(permission, !granted)}
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                              granted
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background text-foreground hover:bg-accent",
                            )}
                          >
                            {permission.displayName ?? permission.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoadingPermissions && groups.length > 0 && (
        <div>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      )}
    </div>
  )
}
