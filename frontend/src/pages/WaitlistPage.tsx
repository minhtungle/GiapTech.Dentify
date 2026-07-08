import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
import { waitlistApi } from "@/lib/waitlist-api"
import { patientsApi } from "@/lib/patients-api"
import { doctorsApi } from "@/lib/doctors-api"
import { servicesApi } from "@/lib/services-api"
import { ApiError } from "@/lib/api"
import type {
  CreateUpdateWaitlistEntryDto,
  WaitlistEntryDto,
  WaitlistStatusName,
} from "@/types/waitlist"
import { WAITLIST_STATUS_LABELS_VI, WaitlistStatus } from "@/types/waitlist"
import type { PatientDto } from "@/types/patient"
import type { DoctorDto } from "@/types/doctor"
import type { ServiceDto } from "@/types/service"

const STATUS_OPTIONS: WaitlistStatusName[] = ["Waiting", "Scheduled", "Cancelled"]

function emptyForm(patientId = ""): CreateUpdateWaitlistEntryDto {
  return {
    patientId,
    doctorId: null,
    serviceId: null,
    preferredTimeNote: "",
    notes: "",
  }
}

export function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntryDto[]>([])
  const [patients, setPatients] = useState<PatientDto[]>([])
  const [doctors, setDoctors] = useState<DoctorDto[]>([])
  const [services, setServices] = useState<ServiceDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState<WaitlistStatusName>("Waiting")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateWaitlistEntryDto>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  const [deletingEntry, setDeletingEntry] = useState<WaitlistEntryDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [entriesResult, patientsResult, doctorsResult, servicesResult] = await Promise.all([
        waitlistApi.getList({
          maxResultCount: 100,
          status: statusFilter,
        }),
        patientsApi.getList({ maxResultCount: 1000 }),
        doctorsApi.getActiveList(),
        servicesApi.getActiveList(),
      ])
      setEntries(entriesResult.items)
      setTotalCount(entriesResult.totalCount)
      setPatients(patientsResult.items)
      setDoctors(doctorsResult)
      setServices(servicesResult)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách chờ")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm(patients[0]?.id ?? ""))
    setDialogOpen(true)
  }

  const openEditDialog = (entry: WaitlistEntryDto) => {
    setEditingId(entry.id)
    setForm({
      patientId: entry.patientId,
      doctorId: entry.doctorId,
      serviceId: entry.serviceId,
      preferredTimeNote: entry.preferredTimeNote ?? "",
      notes: entry.notes ?? "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        await waitlistApi.update(editingId, form)
        toast.success("Đã cập nhật danh sách chờ")
      } else {
        await waitlistApi.create(form)
        toast.success("Đã thêm vào danh sách chờ")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeStatus = async (entry: WaitlistEntryDto, status: WaitlistStatusName) => {
    try {
      await waitlistApi.changeStatus(entry.id, { status })
      toast.success("Đã cập nhật trạng thái")
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật trạng thái thất bại")
    }
  }

  const handleDelete = async () => {
    if (!deletingEntry) return
    setIsDeleting(true)
    try {
      await waitlistApi.delete(deletingEntry.id)
      toast.success("Đã xoá khỏi danh sách chờ")
      setDeletingEntry(null)
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
          <h1 className="text-2xl font-semibold">Danh sách chờ</h1>
          <p className="text-sm text-muted-foreground">{totalCount} bệnh nhân</p>
        </div>
        {patients.length === 0 ? (
          <Button disabled title="Cần thêm bệnh nhân trước">
            <Plus />
            Thêm vào danh sách chờ
          </Button>
        ) : (
          <Button onClick={openCreateDialog}>
            <Plus />
            Thêm vào danh sách chờ
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Select
          value={statusFilter}
          onValueChange={(value: WaitlistStatusName) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {WAITLIST_STATUS_LABELS_VI[WaitlistStatus[status]]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bệnh nhân</TableHead>
              <TableHead>Bác sĩ mong muốn</TableHead>
              <TableHead>Dịch vụ mong muốn</TableHead>
              <TableHead>Khung giờ mong muốn</TableHead>
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
            {!isLoading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ClipboardList className="size-8" />
                    <p>Chưa có bệnh nhân nào trong danh sách chờ.</p>
                    {patients.length > 0 && (
                      <Button variant="outline" size="sm" onClick={openCreateDialog}>
                        <Plus className="size-4" />
                        Thêm bệnh nhân đầu tiên
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.patientFullName}</TableCell>
                <TableCell>{entry.doctorName ?? "—"}</TableCell>
                <TableCell>{entry.serviceName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {entry.preferredTimeNote || "—"}
                </TableCell>
                <TableCell>
                  <Select
                    value={
                      (Object.keys(WaitlistStatus) as WaitlistStatusName[]).find(
                        (key) => WaitlistStatus[key] === entry.status,
                      ) ?? "Waiting"
                    }
                    onValueChange={(value: WaitlistStatusName) => void handleChangeStatus(entry, value)}
                  >
                    <SelectTrigger className="w-36" aria-label={`Đổi trạng thái cho ${entry.patientFullName}`}>
                      <SelectValue>
                        <Badge variant="outline">{WAITLIST_STATUS_LABELS_VI[entry.status]}</Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {WAITLIST_STATUS_LABELS_VI[WaitlistStatus[status]]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Sửa"
                    aria-label={`Sửa thông tin chờ của ${entry.patientFullName}`}
                    onClick={() => openEditDialog(entry)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Xoá"
                    aria-label={`Xoá ${entry.patientFullName} khỏi danh sách chờ`}
                    onClick={() => setDeletingEntry(entry)}
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
              <DialogTitle>{editingId ? "Sửa danh sách chờ" : "Thêm vào danh sách chờ"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="patientId">Bệnh nhân</Label>
              <Select
                value={form.patientId}
                onValueChange={(value: string) => setForm({ ...form, patientId: value })}
              >
                <SelectTrigger id="patientId">
                  <SelectValue placeholder="Chọn bệnh nhân" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="doctorId">Bác sĩ mong muốn</Label>
                <Select
                  value={form.doctorId ?? "none"}
                  onValueChange={(value: string) =>
                    setForm({ ...form, doctorId: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger id="doctorId">
                    <SelectValue placeholder="Không chỉ định" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chỉ định</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serviceId">Dịch vụ mong muốn</Label>
                <Select
                  value={form.serviceId ?? "none"}
                  onValueChange={(value: string) =>
                    setForm({ ...form, serviceId: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger id="serviceId">
                    <SelectValue placeholder="Không chỉ định" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chỉ định</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="preferredTimeNote">Khung giờ mong muốn</Label>
              <Input
                id="preferredTimeNote"
                placeholder="Ví dụ: Sáng thứ 7"
                value={form.preferredTimeNote ?? ""}
                onChange={(e) => setForm({ ...form, preferredTimeNote: e.target.value })}
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

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingEntry !== null}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
        title="Xoá khỏi danh sách chờ"
        description={`Bạn có chắc muốn xoá "${deletingEntry?.patientFullName}" khỏi danh sách chờ? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
