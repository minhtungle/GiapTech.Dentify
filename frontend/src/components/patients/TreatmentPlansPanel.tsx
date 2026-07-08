import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { ClipboardList, Pencil, Plus, Trash2, X } from "lucide-react"
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
import { treatmentPlansApi } from "@/lib/treatment-plans-api"
import { servicesApi } from "@/lib/services-api"
import { appointmentsApi } from "@/lib/appointments-api"
import { ApiError } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type {
  CreateUpdateTreatmentPlanDto,
  CreateUpdateTreatmentPlanItemDto,
  TreatmentPlanDto,
  TreatmentPlanItemStatusName,
  TreatmentPlanStatusName,
} from "@/types/treatmentPlan"
import type { AppointmentDto } from "@/types/appointment"
import {
  TREATMENT_PLAN_ITEM_STATUS_LABELS_VI,
  TREATMENT_PLAN_STATUS_LABELS_VI,
  TreatmentPlanItemStatus,
  TreatmentPlanStatus,
} from "@/types/treatmentPlan"
import type { ServiceDto } from "@/types/service"

interface TreatmentPlansPanelProps {
  patientId: string
}

const PLAN_STATUS_OPTIONS: TreatmentPlanStatusName[] = [
  "Draft",
  "Active",
  "Completed",
  "Cancelled",
]

const ITEM_STATUS_OPTIONS: TreatmentPlanItemStatusName[] = [
  "Pending",
  "InProgress",
  "Completed",
  "Skipped",
]

function emptyForm(patientId: string): CreateUpdateTreatmentPlanDto {
  return { patientId, title: "", notes: "", items: [] }
}

let nextTempKey = 0
function newTempKey(): string {
  nextTempKey += 1
  return `temp-${nextTempKey}`
}

interface ItemRow {
  key: string
  data: CreateUpdateTreatmentPlanItemDto
}

function emptyItemRow(stepOrder: number): ItemRow {
  return {
    key: newTempKey(),
    data: { serviceId: null, stepOrder, description: "", estimatedCost: 0 },
  }
}

export function TreatmentPlansPanel({ patientId }: TreatmentPlansPanelProps) {
  const [plans, setPlans] = useState<TreatmentPlanDto[]>([])
  const [services, setServices] = useState<ServiceDto[]>([])
  const [patientAppointments, setPatientAppointments] = useState<AppointmentDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateTreatmentPlanDto>(emptyForm(patientId))
  const [itemRows, setItemRows] = useState<ItemRow[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const [deletingPlan, setDeletingPlan] = useState<TreatmentPlanDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [linkAppointmentTarget, setLinkAppointmentTarget] = useState<
    { plan: TreatmentPlanDto; itemId: string; currentAppointmentId: string | null } | null
  >(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [plansResult, servicesResult, appointmentsResult] = await Promise.all([
        treatmentPlansApi.getList({ patientId, maxResultCount: 100 }),
        servicesApi.getActiveList(),
        appointmentsApi.getList({ patientId, maxResultCount: 100, sorting: "scheduledDateTime desc" }),
      ])
      setPlans(plansResult.items)
      setServices(servicesResult)
      setPatientAppointments(appointmentsResult.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được kế hoạch điều trị")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm(patientId))
    setItemRows([])
    setDialogOpen(true)
  }

  const openEditDialog = (plan: TreatmentPlanDto) => {
    setEditingId(plan.id)
    setForm({ patientId, title: plan.title, notes: plan.notes ?? "", items: [] })
    setItemRows(
      plan.items.map((item) => ({
        key: item.id,
        data: {
          id: item.id,
          serviceId: item.serviceId,
          stepOrder: item.stepOrder,
          description: item.description,
          estimatedCost: item.estimatedCost,
        },
      })),
    )
    setDialogOpen(true)
  }

  const addItemRow = () => {
    setItemRows((rows) => [...rows, emptyItemRow(rows.length + 1)])
  }

  const updateItemRow = (key: string, patch: Partial<CreateUpdateTreatmentPlanItemDto>) => {
    setItemRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, data: { ...row.data, ...patch } } : row)),
    )
  }

  const removeItemRow = (key: string) => {
    setItemRows((rows) => rows.filter((row) => row.key !== key))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const dto: CreateUpdateTreatmentPlanDto = {
        ...form,
        items: itemRows
          .map((row) => row.data)
          .filter((item) => item.description.trim() !== ""),
      }
      if (editingId) {
        await treatmentPlansApi.update(editingId, dto)
        toast.success("Đã cập nhật kế hoạch điều trị")
      } else {
        await treatmentPlansApi.create(dto)
        toast.success("Đã tạo kế hoạch điều trị mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePlanStatus = async (plan: TreatmentPlanDto, status: TreatmentPlanStatusName) => {
    try {
      await treatmentPlansApi.changeStatus(plan.id, { status })
      toast.success("Đã cập nhật trạng thái kế hoạch")
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleChangeItemStatus = async (
    plan: TreatmentPlanDto,
    itemId: string,
    status: TreatmentPlanItemStatusName,
  ) => {
    try {
      await treatmentPlansApi.changeItemStatus(plan.id, itemId, { status })
      toast.success("Đã cập nhật trạng thái bước điều trị")
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleLinkAppointment = async (appointmentId: string | null) => {
    if (!linkAppointmentTarget) return
    try {
      await treatmentPlansApi.linkItemToAppointment(
        linkAppointmentTarget.plan.id,
        linkAppointmentTarget.itemId,
        { appointmentId },
      )
      toast.success(appointmentId ? "Đã gắn lịch hẹn" : "Đã gỡ lịch hẹn")
      setLinkAppointmentTarget(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật thất bại")
    }
  }

  const handleDelete = async () => {
    if (!deletingPlan) return
    setIsDeleting(true)
    try {
      await treatmentPlansApi.delete(deletingPlan.id)
      toast.success("Đã xoá kế hoạch điều trị")
      setDeletingPlan(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="size-4" />
          Thêm kế hoạch điều trị
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && plans.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border py-10 text-muted-foreground">
          <ClipboardList className="size-8" />
          <p>Chưa có kế hoạch điều trị nào.</p>
        </div>
      )}

      {!isLoading &&
        plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{plan.title}</h3>
                <Badge variant="outline">{TREATMENT_PLAN_STATUS_LABELS_VI[plan.status]}</Badge>
                <span className="text-xs text-muted-foreground">
                  Tạo ngày {new Date(plan.creationTime).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={
                    (Object.keys(TreatmentPlanStatus) as TreatmentPlanStatusName[]).find(
                      (key) => TreatmentPlanStatus[key] === plan.status,
                    ) ?? "Draft"
                  }
                  onValueChange={(value: TreatmentPlanStatusName) =>
                    void handleChangePlanStatus(plan, value)
                  }
                >
                  <SelectTrigger className="w-40" aria-label={`Đổi trạng thái kế hoạch ${plan.title}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {TREATMENT_PLAN_STATUS_LABELS_VI[TreatmentPlanStatus[status]]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Sửa"
                  aria-label={`Sửa kế hoạch ${plan.title}`}
                  onClick={() => openEditDialog(plan)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Xoá"
                  aria-label={`Xoá kế hoạch ${plan.title}`}
                  onClick={() => setDeletingPlan(plan)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {plan.notes && <p className="mt-2 text-sm text-muted-foreground">{plan.notes}</p>}

            <div className="mt-3 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Dịch vụ</TableHead>
                    <TableHead>Chi phí dự kiến</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Lịch hẹn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                        Chưa có bước điều trị nào.
                      </TableCell>
                    </TableRow>
                  )}
                  {[...plan.items]
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.stepOrder}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.serviceName ?? "—"}</TableCell>
                        <TableCell>{formatCurrency(item.estimatedCost)}</TableCell>
                        <TableCell>
                          <Select
                            value={
                              (Object.keys(TreatmentPlanItemStatus) as TreatmentPlanItemStatusName[]).find(
                                (key) => TreatmentPlanItemStatus[key] === item.status,
                              ) ?? "Pending"
                            }
                            onValueChange={(value: TreatmentPlanItemStatusName) =>
                              void handleChangeItemStatus(plan, item.id, value)
                            }
                          >
                            <SelectTrigger
                              className="w-40"
                              aria-label={`Đổi trạng thái bước "${item.description}"`}
                            >
                              <SelectValue>
                                <Badge variant="outline">
                                  {TREATMENT_PLAN_ITEM_STATUS_LABELS_VI[item.status]}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {ITEM_STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {TREATMENT_PLAN_ITEM_STATUS_LABELS_VI[TreatmentPlanItemStatus[status]]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setLinkAppointmentTarget({
                                plan,
                                itemId: item.id,
                                currentAppointmentId: item.appointmentId ?? null,
                              })
                            }
                          >
                            {item.appointmentId
                              ? patientAppointments.find((a) => a.id === item.appointmentId)
                                ? new Date(
                                    patientAppointments.find((a) => a.id === item.appointmentId)!.scheduledDateTime,
                                  ).toLocaleDateString("vi-VN")
                                : "Đã gắn lịch hẹn"
                              : "Gắn lịch hẹn"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa kế hoạch điều trị" : "Thêm kế hoạch điều trị"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <ClipboardList className="size-4" />
                  Các bước điều trị
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                  <Plus className="size-3.5" />
                  Thêm bước
                </Button>
              </div>

              {itemRows.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có bước điều trị nào.</p>
              )}

              {itemRows.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-2 gap-2 rounded-md border p-2 sm:grid-cols-[3.5rem_2fr_2fr_7rem_auto] sm:items-start sm:border-0 sm:p-0"
                >
                  <Input
                    type="number"
                    min={1}
                    placeholder="STT"
                    aria-label="Thứ tự bước"
                    value={row.data.stepOrder}
                    onChange={(e) => updateItemRow(row.key, { stepOrder: Number(e.target.value) })}
                  />
                  <Input
                    placeholder="Nội dung"
                    aria-label="Nội dung bước điều trị"
                    className="col-span-2 sm:col-span-1"
                    value={row.data.description}
                    onChange={(e) => updateItemRow(row.key, { description: e.target.value })}
                  />
                  <Select
                    value={row.data.serviceId ?? "none"}
                    onValueChange={(value: string) =>
                      updateItemRow(row.key, { serviceId: value === "none" ? null : value })
                    }
                  >
                    <SelectTrigger aria-label="Chọn dịch vụ">
                      <SelectValue placeholder="Dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không liên kết</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Chi phí"
                    aria-label="Chi phí dự kiến"
                    value={row.data.estimatedCost}
                    onChange={(e) =>
                      updateItemRow(row.key, { estimatedCost: Number(e.target.value) })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-2 justify-self-end sm:col-span-1"
                    title="Xoá bước"
                    aria-label="Xoá bước điều trị"
                    onClick={() => removeItemRow(row.key)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
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
        open={deletingPlan !== null}
        onOpenChange={(open) => !open && setDeletingPlan(null)}
        title="Xoá kế hoạch điều trị"
        description={`Bạn có chắc muốn xoá kế hoạch "${deletingPlan?.title}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />

      <Dialog
        open={linkAppointmentTarget !== null}
        onOpenChange={(open) => !open && setLinkAppointmentTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gắn lịch hẹn cho bước điều trị</DialogTitle>
          </DialogHeader>
          <Select
            value={linkAppointmentTarget?.currentAppointmentId ?? "none"}
            onValueChange={(value: string) => void handleLinkAppointment(value === "none" ? null : value)}
          >
            <SelectTrigger aria-label="Chọn lịch hẹn">
              <SelectValue placeholder="Chọn lịch hẹn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Không liên kết</SelectItem>
              {patientAppointments.map((appointment) => (
                <SelectItem key={appointment.id} value={appointment.id}>
                  {new Date(appointment.scheduledDateTime).toLocaleString("vi-VN")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>
    </div>
  )
}
