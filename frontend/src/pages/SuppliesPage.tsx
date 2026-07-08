import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Ban,
  CheckCircle2,
  ClipboardPlus,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { suppliesApi, supplyUsagesApi } from "@/lib/supplies-api"
import { appointmentsApi } from "@/lib/appointments-api"
import { ApiError } from "@/lib/api"
import type { CreateSupplyUsageDto, CreateUpdateSupplyDto, SupplyDto } from "@/types/supply"
import type { AppointmentDto } from "@/types/appointment"

function emptySupplyForm(): CreateUpdateSupplyDto {
  return { name: "", unit: "", lowStockThreshold: null }
}

function emptyRestockForm() {
  return { quantity: 0 }
}

function emptyUsageForm(supplyId = ""): CreateSupplyUsageDto {
  return {
    supplyId,
    quantity: 0,
    appointmentId: null,
    usedAt: new Date().toISOString().slice(0, 10),
    notes: "",
  }
}

function isLowStock(supply: SupplyDto): boolean {
  return supply.lowStockThreshold != null && supply.quantity <= supply.lowStockThreshold
}

export function SuppliesPage() {
  const [supplies, setSupplies] = useState<SupplyDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateSupplyDto>(emptySupplyForm())
  const [isSaving, setIsSaving] = useState(false)

  const [restockSupply, setRestockSupply] = useState<SupplyDto | null>(null)
  const [restockForm, setRestockForm] = useState(emptyRestockForm())
  const [isRestocking, setIsRestocking] = useState(false)

  const [usageDialogOpen, setUsageDialogOpen] = useState(false)
  const [usageForm, setUsageForm] = useState<CreateSupplyUsageDto>(emptyUsageForm())
  const [isSavingUsage, setIsSavingUsage] = useState(false)
  const [recentAppointments, setRecentAppointments] = useState<AppointmentDto[]>([])

  const [deletingSupply, setDeletingSupply] = useState<SupplyDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await suppliesApi.getActiveList()
      setSupplies(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách vật tư")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptySupplyForm())
    setDialogOpen(true)
  }

  const openEditDialog = (supply: SupplyDto) => {
    setEditingId(supply.id)
    setForm({
      name: supply.name,
      unit: supply.unit,
      lowStockThreshold: supply.lowStockThreshold ?? null,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        await suppliesApi.update(editingId, form)
        toast.success("Đã cập nhật vật tư")
      } else {
        await suppliesApi.create(form)
        toast.success("Đã thêm vật tư mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const openRestockDialog = (supply: SupplyDto) => {
    setRestockSupply(supply)
    setRestockForm(emptyRestockForm())
  }

  const handleRestockSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!restockSupply) return
    setIsRestocking(true)
    try {
      await suppliesApi.restock(restockSupply.id, restockForm)
      toast.success("Đã nhập kho")
      setRestockSupply(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Nhập kho thất bại")
    } finally {
      setIsRestocking(false)
    }
  }

  const openUsageDialog = async () => {
    setUsageForm(emptyUsageForm(supplies[0]?.id ?? ""))
    setUsageDialogOpen(true)
    try {
      const result = await appointmentsApi.getList({
        maxResultCount: 100,
        sorting: "scheduledDateTime desc",
      })
      setRecentAppointments(result.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách lịch hẹn")
    }
  }

  const handleUsageSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSavingUsage(true)
    try {
      await supplyUsagesApi.create({
        ...usageForm,
        usedAt: new Date(usageForm.usedAt).toISOString(),
      })
      toast.success("Đã ghi nhận sử dụng vật tư")
      setUsageDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Ghi nhận thất bại")
    } finally {
      setIsSavingUsage(false)
    }
  }

  const handleToggleActive = async (supply: SupplyDto) => {
    try {
      if (supply.isActive) {
        await suppliesApi.deactivate(supply.id)
        toast.success("Đã ngừng sử dụng vật tư")
      } else {
        await suppliesApi.activate(supply.id)
        toast.success("Đã kích hoạt lại vật tư")
      }
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleDelete = async () => {
    if (!deletingSupply) return
    setIsDeleting(true)
    try {
      await suppliesApi.delete(deletingSupply.id)
      toast.success("Đã xoá vật tư")
      setDeletingSupply(null)
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
          <h1 className="text-2xl font-semibold">Vật tư</h1>
          <p className="text-sm text-muted-foreground">{supplies.length} vật tư</p>
        </div>
        <div className="flex gap-2">
          {supplies.length === 0 ? (
            <Button disabled title="Cần thêm vật tư trước">
              <ClipboardPlus />
              Ghi nhận sử dụng
            </Button>
          ) : (
            <Button variant="outline" onClick={() => void openUsageDialog()}>
              <ClipboardPlus />
              Ghi nhận sử dụng
            </Button>
          )}
          <Button onClick={openCreateDialog}>
            <Plus />
            Thêm vật tư
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên vật tư</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Ngưỡng cảnh báo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && supplies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="size-8" />
                    <p>Chưa có vật tư nào.</p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus className="size-4" />
                      Thêm vật tư đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              supplies.map((supply) => (
                <TableRow key={supply.id}>
                  <TableCell className="font-medium">{supply.name}</TableCell>
                  <TableCell>{supply.unit}</TableCell>
                  <TableCell>
                    <span className={isLowStock(supply) ? "font-medium text-destructive" : ""}>
                      {supply.quantity}
                    </span>
                    {isLowStock(supply) && (
                      <Badge variant="destructive" className="ml-2">
                        Sắp hết hàng
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{supply.lowStockThreshold ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={supply.isActive ? "success" : "outline"}>
                      {supply.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Nhập kho"
                      aria-label={`Nhập kho cho ${supply.name}`}
                      onClick={() => openRestockDialog(supply)}
                    >
                      <PackagePlus className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Sửa"
                      aria-label={`Sửa vật tư ${supply.name}`}
                      onClick={() => openEditDialog(supply)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={supply.isActive ? "Ngừng sử dụng" : "Kích hoạt lại"}
                      aria-label={`${supply.isActive ? "Ngừng sử dụng" : "Kích hoạt lại"} ${supply.name}`}
                      onClick={() => void handleToggleActive(supply)}
                    >
                      {supply.isActive ? (
                        <Ban className="size-4" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Xoá"
                      aria-label={`Xoá vật tư ${supply.name}`}
                      onClick={() => setDeletingSupply(supply)}
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
              <DialogTitle>{editingId ? "Sửa vật tư" : "Thêm vật tư"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="name">Tên vật tư</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit">Đơn vị</Label>
                <Input
                  id="unit"
                  required
                  placeholder="Ví dụ: hộp, cái, chai"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lowStockThreshold">Ngưỡng cảnh báo</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min={0}
                  value={form.lowStockThreshold ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lowStockThreshold: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={restockSupply !== null} onOpenChange={(open) => !open && setRestockSupply(null)}>
        <DialogContent>
          <form onSubmit={handleRestockSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Nhập kho — {restockSupply?.name}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="restockQuantity">Số lượng nhập thêm</Label>
              <Input
                id="restockQuantity"
                type="number"
                min={0.0001}
                step="0.0001"
                required
                value={restockForm.quantity}
                onChange={(e) => setRestockForm({ quantity: Number(e.target.value) })}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isRestocking}>
                {isRestocking ? "Đang lưu..." : "Nhập kho"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUsageSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Ghi nhận sử dụng vật tư</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="usageSupplyId">Vật tư</Label>
              <Select
                value={usageForm.supplyId}
                onValueChange={(value: string) => setUsageForm({ ...usageForm, supplyId: value })}
              >
                <SelectTrigger id="usageSupplyId">
                  <SelectValue placeholder="Chọn vật tư" />
                </SelectTrigger>
                <SelectContent>
                  {supplies.map((supply) => (
                    <SelectItem key={supply.id} value={supply.id}>
                      {supply.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usageQuantity">Số lượng sử dụng</Label>
                <Input
                  id="usageQuantity"
                  type="number"
                  min={0.0001}
                  step="0.0001"
                  required
                  value={usageForm.quantity}
                  onChange={(e) => setUsageForm({ ...usageForm, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="usedAt">Ngày sử dụng</Label>
                <Input
                  id="usedAt"
                  type="date"
                  required
                  value={usageForm.usedAt.slice(0, 10)}
                  onChange={(e) => setUsageForm({ ...usageForm, usedAt: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="usageAppointmentId">Lịch hẹn liên quan (tuỳ chọn)</Label>
              <Select
                value={usageForm.appointmentId ?? "none"}
                onValueChange={(value: string) =>
                  setUsageForm({ ...usageForm, appointmentId: value === "none" ? null : value })
                }
              >
                <SelectTrigger id="usageAppointmentId">
                  <SelectValue placeholder="Không liên kết" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không liên kết</SelectItem>
                  {recentAppointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id}>
                      {appointment.patientFullName} —{" "}
                      {new Date(appointment.scheduledDateTime).toLocaleString("vi-VN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="usageNotes">Ghi chú</Label>
              <Textarea
                id="usageNotes"
                value={usageForm.notes ?? ""}
                onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSavingUsage}>
                {isSavingUsage ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingSupply !== null}
        onOpenChange={(open) => !open && setDeletingSupply(null)}
        title="Xoá vật tư"
        description={`Bạn có chắc muốn xoá vật tư "${deletingSupply?.name}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
