import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Ban, CheckCircle2, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { IdentityUserPicker } from "@/components/IdentityUserPicker"
import {
  Dialog,
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
import { doctorsApi } from "@/lib/doctors-api"
import { ApiError } from "@/lib/api"
import type { CreateUpdateDoctorDto, DoctorDto } from "@/types/doctor"

function emptyForm(): CreateUpdateDoctorDto {
  return { identityUserId: "", specialization: "" }
}

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateDoctorDto>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  const [deletingDoctor, setDeletingDoctor] = useState<DoctorDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await doctorsApi.getActiveList()
      setDoctors(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách bác sĩ")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEditDialog = (doctor: DoctorDto) => {
    setEditingId(doctor.id)
    setForm({
      identityUserId: doctor.identityUserId,
      specialization: doctor.specialization ?? "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.identityUserId) {
      toast.error("Vui lòng chọn tài khoản người dùng")
      return
    }
    setIsSaving(true)
    try {
      if (editingId) {
        await doctorsApi.update(editingId, form)
        toast.success("Đã cập nhật bác sĩ")
      } else {
        await doctorsApi.create(form)
        toast.success("Đã thêm bác sĩ mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (doctor: DoctorDto) => {
    try {
      if (doctor.isActive) {
        await doctorsApi.deactivate(doctor.id)
        toast.success("Đã ngừng hoạt động")
      } else {
        await doctorsApi.activate(doctor.id)
        toast.success("Đã kích hoạt lại")
      }
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleDelete = async () => {
    if (!deletingDoctor) return
    setIsDeleting(true)
    try {
      await doctorsApi.delete(deletingDoctor.id)
      toast.success("Đã xoá bác sĩ")
      setDeletingDoctor(null)
      await loadData()
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
          <h1 className="text-2xl font-semibold">Bác sĩ</h1>
          <p className="text-sm text-muted-foreground">{doctors.length} bác sĩ</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Thêm bác sĩ
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Chuyên khoa</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Stethoscope className="size-8" />
                    <p>Chưa có bác sĩ nào.</p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus className="size-4" />
                      Thêm bác sĩ đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.fullName}</TableCell>
                  <TableCell>{doctor.specialization || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={doctor.isActive ? "success" : "outline"}>
                      {doctor.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Sửa"
                      aria-label={`Sửa bác sĩ ${doctor.fullName}`}
                      onClick={() => openEditDialog(doctor)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={doctor.isActive ? "Ngừng hoạt động" : "Kích hoạt lại"}
                      aria-label={`${doctor.isActive ? "Ngừng hoạt động" : "Kích hoạt lại"} ${doctor.fullName}`}
                      onClick={() => void handleToggleActive(doctor)}
                    >
                      {doctor.isActive ? (
                        <Ban className="size-4" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Xoá"
                      aria-label={`Xoá bác sĩ ${doctor.fullName}`}
                      onClick={() => setDeletingDoctor(doctor)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa bác sĩ" : "Thêm bác sĩ"}</DialogTitle>
            </DialogHeader>

            {!editingId && (
              <IdentityUserPicker
                value={form.identityUserId || null}
                onChange={(identityUserId) => setForm({ ...form, identityUserId })}
              />
            )}

            <div className="grid gap-2">
              <Label htmlFor="specialization">Chuyên khoa</Label>
              <Input
                id="specialization"
                placeholder="Ví dụ: Nha khoa tổng quát"
                value={form.specialization ?? ""}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingDoctor !== null}
        onOpenChange={(open) => !open && setDeletingDoctor(null)}
        title="Xoá bác sĩ"
        description={`Bạn có chắc muốn xoá bác sĩ "${deletingDoctor?.fullName}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
