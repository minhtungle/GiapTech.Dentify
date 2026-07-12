import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Ban,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Users as UsersIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { identityUsersApi } from "@/lib/identity-users-api"
import { ApiError } from "@/lib/api"
import { roleDisplayName } from "@/lib/role-labels"
import { cn } from "@/lib/utils"
import type {
  CreateIdentityUserDto,
  IdentityRoleDto,
  IdentityUserDto,
  UpdateIdentityUserDto,
} from "@/types/identityUser"

type UserFormState = CreateIdentityUserDto & { password?: string | null }

function emptyForm(): UserFormState {
  return {
    userName: "",
    name: "",
    surname: "",
    email: "",
    phoneNumber: "",
    isActive: true,
    lockoutEnabled: true,
    password: "",
    roleNames: [],
  }
}

export function UsersPage() {
  const [users, setUsers] = useState<IdentityUserDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [assignableRoles, setAssignableRoles] = useState<IdentityRoleDto[]>([])

  const [searchTerm, setSearchTerm] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm())
  const [changePassword, setChangePassword] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [deletingUser, setDeletingUser] = useState<IdentityUserDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async (filter?: string) => {
    setIsLoading(true)
    try {
      const [usersResult, rolesResult] = await Promise.all([
        identityUsersApi.getList({ filter, maxResultCount: 100, sorting: "userName" }),
        identityUsersApi.getAssignableRoles(),
      ])
      setUsers(usersResult.items)
      setTotalCount(usersResult.totalCount)
      setAssignableRoles(rolesResult.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách người dùng")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm())
    setChangePassword(true)
    setDialogOpen(true)
  }

  const openEditDialog = async (user: IdentityUserDto) => {
    setEditingId(user.id)
    setChangePassword(false)
    try {
      const roles = await identityUsersApi.getRoles(user.id)
      setForm({
        userName: user.userName,
        name: user.name ?? "",
        surname: user.surname ?? "",
        email: user.email ?? "",
        phoneNumber: user.phoneNumber ?? "",
        isActive: user.isActive,
        lockoutEnabled: user.lockoutEnabled,
        password: "",
        roleNames: roles.items.map((r) => r.name),
      })
      setDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được thông tin người dùng")
    }
  }

  const toggleRole = (roleName: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      roleNames: checked
        ? [...prev.roleNames, roleName]
        : prev.roleNames.filter((r) => r !== roleName),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        const dto: UpdateIdentityUserDto = {
          userName: form.userName,
          name: form.name,
          surname: form.surname,
          email: form.email,
          phoneNumber: form.phoneNumber,
          isActive: form.isActive,
          lockoutEnabled: form.lockoutEnabled,
          roleNames: form.roleNames,
          password: changePassword ? form.password || undefined : undefined,
        }
        await identityUsersApi.update(editingId, dto)
        toast.success("Đã cập nhật người dùng")
      } else {
        await identityUsersApi.create({
          ...form,
          password: form.password ?? "",
        })
        toast.success("Đã tạo người dùng mới")
      }
      setDialogOpen(false)
      await loadData(searchTerm)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleLockout = async (user: IdentityUserDto) => {
    try {
      const roles = await identityUsersApi.getRoles(user.id)
      await identityUsersApi.update(user.id, {
        userName: user.userName,
        name: user.name,
        surname: user.surname,
        email: user.email ?? "",
        phoneNumber: user.phoneNumber,
        isActive: !user.isActive,
        lockoutEnabled: user.lockoutEnabled,
        roleNames: roles.items.map((r) => r.name),
      })
      toast.success(user.isActive ? "Đã khoá tài khoản" : "Đã mở khoá tài khoản")
      await loadData(searchTerm)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    setIsDeleting(true)
    try {
      await identityUsersApi.delete(deletingUser.id)
      toast.success("Đã xoá người dùng")
      setDeletingUser(null)
      await loadData(searchTerm)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Người dùng</h1>
          <p className="text-sm text-muted-foreground">{totalCount} tài khoản</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Thêm người dùng
        </Button>
      </div>

      <div className="flex items-end gap-2">
        <Input
          placeholder="Tìm theo tên, username hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void loadData(searchTerm)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => void loadData(searchTerm)}>
          Tìm
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>Username / Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UsersIcon className="size-8" />
                    <p>Chưa có người dùng nào.</p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus className="size-4" />
                      Thêm người dùng đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {[user.name, user.surname].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.userName}
                    {user.email ? ` — ${user.email}` : ""}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(user.roleNames ?? []).map((role) => (
                        <Badge key={role} variant="outline">
                          {roleDisplayName(role)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "success" : "destructive"}>
                      {user.isActive ? "Hoạt động" : "Đã khoá"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Hành động cho ${user.userName}`}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void openEditDialog(user)}>
                          <Pencil className="size-4" />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void handleToggleLockout(user)}>
                          {user.isActive ? (
                            <Ban className="size-4" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          {user.isActive ? "Khoá tài khoản" : "Mở khoá tài khoản"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingUser(user)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Xoá
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa người dùng" : "Thêm người dùng"}</DialogTitle>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  required
                  value={form.userName}
                  onChange={(e) => setForm({ ...form, userName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Họ</Label>
                <Input
                  id="name"
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="surname">Tên</Label>
                <Input
                  id="surname"
                  value={form.surname ?? ""}
                  onChange={(e) => setForm({ ...form, surname: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input
                id="phoneNumber"
                value={form.phoneNumber ?? ""}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
            </div>

            {editingId && (
              <label className="flex items-center gap-2 text-sm font-normal">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={changePassword}
                  onChange={(e) => setChangePassword(e.target.checked)}
                />
                Đổi mật khẩu
              </label>
            )}

            {(!editingId || changePassword) && (
              <div className="grid gap-2">
                <Label htmlFor="password">
                  {editingId ? "Mật khẩu mới" : "Mật khẩu tạm (đọc cho nhân viên)"}
                </Label>
                <Input
                  id="password"
                  type="text"
                  required={!editingId || changePassword}
                  value={form.password ?? ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Vai trò</Label>
              <div className="flex flex-wrap gap-2">
                {assignableRoles.map((role) => {
                  const selected = form.roleNames.includes(role.name)
                  return (
                    <button
                      key={role.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleRole(role.name, !selected)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:bg-accent",
                      )}
                    >
                      {roleDisplayName(role.name)}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-normal">
              <input
                type="checkbox"
                className="size-4"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Đang hoạt động
            </label>
            </DialogBody>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingUser !== null}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="Xoá người dùng"
        description={`Bạn có chắc muốn xoá người dùng "${deletingUser?.userName}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
