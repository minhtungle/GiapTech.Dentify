import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Image, Pencil, Pill, Plus, Trash2, Wallet, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { AppointmentPhotosDialog } from "@/components/appointments/AppointmentPhotosDialog"
import { appointmentsApi } from "@/lib/appointments-api"
import { patientsApi } from "@/lib/patients-api"
import { ApiError } from "@/lib/api"
import type {
  AppointmentDto,
  AppointmentStatusName,
  CreateUpdateAppointmentDto,
  CreateUpdatePrescriptionItemDto,
} from "@/types/appointment"
import {
  APPOINTMENT_STATUS_LABELS_VI,
  AppointmentStatus,
  PAYMENT_STATUS_LABELS_VI,
} from "@/types/appointment"
import type { PatientDto } from "@/types/patient"

const STATUS_OPTIONS: AppointmentStatusName[] = [
  "Scheduled",
  "InProgress",
  "Completed",
  "Cancelled",
  "NoShow",
]

function emptyForm(patientId = ""): CreateUpdateAppointmentDto {
  return {
    patientId,
    scheduledDateTime: "",
    status: "Scheduled",
    preOpNotes: "",
    postOpNotes: "",
    price: 0,
    prescriptionItems: [],
  }
}

let nextTempKey = 0
function newTempKey(): string {
  nextTempKey += 1
  return `temp-${nextTempKey}`
}

interface PrescriptionItemRow {
  key: string
  data: CreateUpdatePrescriptionItemDto
}

function emptyPrescriptionRow(): PrescriptionItemRow {
  return {
    key: newTempKey(),
    data: { drugName: "", dosage: "", quantity: 1, instructions: "" },
  }
}

function toLocalInputValue(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [patients, setPatients] = useState<PatientDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateAppointmentDto>(emptyForm())
  const [prescriptionRows, setPrescriptionRows] = useState<PrescriptionItemRow[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const [paymentDialogAppointment, setPaymentDialogAppointment] =
    useState<AppointmentDto | null>(null)
  const [paidAmountInput, setPaidAmountInput] = useState("0")
  const [isSavingPayment, setIsSavingPayment] = useState(false)

  const [photosDialogAppointment, setPhotosDialogAppointment] =
    useState<AppointmentDto | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [appointmentsResult, patientsResult] = await Promise.all([
        appointmentsApi.getList({ maxResultCount: 100, sorting: "scheduledDateTime desc" }),
        patientsApi.getList({ maxResultCount: 1000 }),
      ])
      setAppointments(appointmentsResult.items)
      setTotalCount(appointmentsResult.totalCount)
      setPatients(patientsResult.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách lịch hẹn")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm(patients[0]?.id ?? ""))
    setPrescriptionRows([])
    setDialogOpen(true)
  }

  const openEditDialog = async (summary: AppointmentDto) => {
    setEditingId(summary.id)
    setDialogOpen(true)

    // GetListAsync doesn't include PrescriptionItems (avoids an extra join for the table view),
    // so fetch the full detail via GetAsync before populating the form.
    let appointment = summary
    try {
      appointment = await appointmentsApi.get(summary.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được chi tiết lịch hẹn")
    }

    setForm({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      scheduledDateTime: toLocalInputValue(appointment.scheduledDateTime),
      status: (Object.keys(AppointmentStatus) as AppointmentStatusName[]).find(
        (key) => AppointmentStatus[key] === appointment.status,
      ) ?? "Scheduled",
      preOpNotes: appointment.preOpNotes ?? "",
      postOpNotes: appointment.postOpNotes ?? "",
      price: appointment.price,
      prescriptionItems: [],
    })
    setPrescriptionRows(
      appointment.prescriptionItems.map((item) => ({
        key: item.id,
        data: {
          id: item.id,
          drugName: item.drugName,
          dosage: item.dosage ?? "",
          quantity: item.quantity,
          instructions: item.instructions ?? "",
        },
      })),
    )
  }

  const addPrescriptionRow = () => {
    setPrescriptionRows((rows) => [...rows, emptyPrescriptionRow()])
  }

  const updatePrescriptionRow = (key: string, patch: Partial<CreateUpdatePrescriptionItemDto>) => {
    setPrescriptionRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, data: { ...row.data, ...patch } } : row)),
    )
  }

  const removePrescriptionRow = (key: string) => {
    setPrescriptionRows((rows) => rows.filter((row) => row.key !== key))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const dto = {
        ...form,
        scheduledDateTime: new Date(form.scheduledDateTime).toISOString(),
        prescriptionItems: prescriptionRows
          .map((row) => row.data)
          .filter((item) => item.drugName.trim() !== ""),
      }
      if (editingId) {
        await appointmentsApi.update(editingId, dto)
        toast.success("Đã cập nhật lịch hẹn")
      } else {
        await appointmentsApi.create(dto)
        toast.success("Đã tạo lịch hẹn mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (appointment: AppointmentDto) => {
    if (!confirm(`Xoá lịch hẹn của "${appointment.patientFullName}"?`)) return
    try {
      await appointmentsApi.delete(appointment.id)
      toast.success("Đã xoá lịch hẹn")
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    }
  }

  const openPaymentDialog = (appointment: AppointmentDto) => {
    setPaymentDialogAppointment(appointment)
    setPaidAmountInput(String(appointment.paidAmount))
  }

  const handleSavePayment = async (e: FormEvent) => {
    e.preventDefault()
    if (!paymentDialogAppointment) return
    setIsSavingPayment(true)
    try {
      await appointmentsApi.updatePayment(paymentDialogAppointment.id, {
        paidAmount: Number(paidAmountInput),
      })
      toast.success("Đã cập nhật thanh toán")
      setPaymentDialogAppointment(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật thanh toán thất bại")
    } finally {
      setIsSavingPayment(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lịch hẹn</h1>
          <p className="text-sm text-muted-foreground">{totalCount} lịch hẹn</p>
        </div>
        <Button onClick={openCreateDialog} disabled={patients.length === 0}>
          <Plus />
          Thêm lịch hẹn
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bệnh nhân</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Chưa có lịch hẹn nào.
                </TableCell>
              </TableRow>
            )}
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">{appointment.patientFullName}</TableCell>
                <TableCell>
                  {new Date(appointment.scheduledDateTime).toLocaleString("vi-VN")}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {APPOINTMENT_STATUS_LABELS_VI[appointment.status]}
                  </Badge>
                </TableCell>
                <TableCell>{appointment.price.toLocaleString("vi-VN")}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      appointment.paymentStatus === 2
                        ? "success"
                        : appointment.paymentStatus === 1
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {PAYMENT_STATUS_LABELS_VI[appointment.paymentStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Ảnh lịch hẹn"
                    onClick={() => setPhotosDialogAppointment(appointment)}
                  >
                    <Image className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openPaymentDialog(appointment)}>
                    <Wallet className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => void openEditDialog(appointment)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => void handleDelete(appointment)}>
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
              <DialogTitle>{editingId ? "Sửa lịch hẹn" : "Thêm lịch hẹn"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label>Bệnh nhân</Label>
              <Select
                value={form.patientId}
                onValueChange={(value: string) => setForm({ ...form, patientId: value })}
              >
                <SelectTrigger>
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
                <Label htmlFor="scheduledDateTime">Thời gian hẹn</Label>
                <Input
                  id="scheduledDateTime"
                  type="datetime-local"
                  required
                  value={form.scheduledDateTime}
                  onChange={(e) => setForm({ ...form, scheduledDateTime: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: AppointmentStatusName) =>
                    setForm({ ...form, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {APPOINTMENT_STATUS_LABELS_VI[AppointmentStatus[status]]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Giá dịch vụ</Label>
              <Input
                id="price"
                type="number"
                min={0}
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="preOpNotes">Ghi chú trước điều trị</Label>
              <Textarea
                id="preOpNotes"
                value={form.preOpNotes ?? ""}
                onChange={(e) => setForm({ ...form, preOpNotes: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="postOpNotes">Ghi chú sau điều trị</Label>
              <Textarea
                id="postOpNotes"
                value={form.postOpNotes ?? ""}
                onChange={(e) => setForm({ ...form, postOpNotes: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Pill className="size-4" />
                  Đơn thuốc
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addPrescriptionRow}>
                  <Plus className="size-3.5" />
                  Thêm thuốc
                </Button>
              </div>

              {prescriptionRows.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có thuốc nào trong đơn.</p>
              )}

              {prescriptionRows.map((row) => (
                <div key={row.key} className="grid grid-cols-[2fr_1fr_5rem_2fr_auto] gap-2 items-start">
                  <Input
                    placeholder="Tên thuốc"
                    value={row.data.drugName}
                    onChange={(e) => updatePrescriptionRow(row.key, { drugName: e.target.value })}
                  />
                  <Input
                    placeholder="Liều lượng"
                    value={row.data.dosage ?? ""}
                    onChange={(e) => updatePrescriptionRow(row.key, { dosage: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="SL"
                    value={row.data.quantity}
                    onChange={(e) => updatePrescriptionRow(row.key, { quantity: Number(e.target.value) })}
                  />
                  <Input
                    placeholder="Hướng dẫn sử dụng"
                    value={row.data.instructions ?? ""}
                    onChange={(e) => updatePrescriptionRow(row.key, { instructions: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrescriptionRow(row.key)}
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

      <Dialog
        open={paymentDialogAppointment !== null}
        onOpenChange={(open) => !open && setPaymentDialogAppointment(null)}
      >
        <DialogContent>
          <form onSubmit={handleSavePayment} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Cập nhật thanh toán</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Giá dịch vụ: {paymentDialogAppointment?.price.toLocaleString("vi-VN")}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="paidAmount">Số tiền đã thanh toán</Label>
              <Input
                id="paidAmount"
                type="number"
                min={0}
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSavingPayment}>
                {isSavingPayment ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AppointmentPhotosDialog
        appointmentId={photosDialogAppointment?.id ?? null}
        patientName={photosDialogAppointment?.patientFullName}
        onOpenChange={(open) => !open && setPhotosDialogAppointment(null)}
      />
    </div>
  )
}
