import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { CalendarPlus, Image, Pencil, Pill, Plus, Trash2, Wallet, X } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AppointmentPhotosDialog } from "@/components/appointments/AppointmentPhotosDialog"
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar"
import { PaymentHistoryDialog } from "@/components/appointments/PaymentHistoryDialog"
import { appointmentsApi } from "@/lib/appointments-api"
import { patientsApi } from "@/lib/patients-api"
import { ApiError } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type {
  AppointmentDto,
  AppointmentStatusName,
  CreateUpdateAppointmentDto,
  CreateUpdatePrescriptionItemDto,
  TreatmentTypeName,
} from "@/types/appointment"
import {
  APPOINTMENT_STATUS_LABELS_VI,
  AppointmentStatus,
  PAYMENT_STATUS_LABELS_VI,
  TREATMENT_TYPE_LABELS_VI,
  TreatmentType,
} from "@/types/appointment"
import type { PatientDto } from "@/types/patient"

const STATUS_OPTIONS: AppointmentStatusName[] = [
  "Scheduled",
  "InProgress",
  "Completed",
  "Cancelled",
  "NoShow",
]

const TREATMENT_TYPE_OPTIONS: TreatmentTypeName[] = [
  "GeneralCheckup",
  "Filling",
  "Extraction",
  "Whitening",
  "RootCanal",
  "Orthodontics",
  "Implant",
  "Cleaning",
  "Crown",
  "Other",
]

function emptyForm(patientId = ""): CreateUpdateAppointmentDto {
  return {
    patientId,
    scheduledDateTime: "",
    status: "Scheduled",
    treatmentType: "GeneralCheckup",
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
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const [paymentDialogAppointment, setPaymentDialogAppointment] =
    useState<AppointmentDto | null>(null)

  const [photosDialogAppointment, setPhotosDialogAppointment] =
    useState<AppointmentDto | null>(null)

  const [deletingAppointment, setDeletingAppointment] = useState<AppointmentDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [calendarAppointments, setCalendarAppointments] = useState<AppointmentDto[]>([])

  const [nameFilter, setNameFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusName | "">("")
  const [treatmentTypeFilter, setTreatmentTypeFilter] = useState<TreatmentTypeName | "">("")
  const [fromDateFilter, setFromDateFilter] = useState("")
  const [toDateFilter, setToDateFilter] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [appointmentsResult, patientsResult] = await Promise.all([
        appointmentsApi.getList({
          maxResultCount: 100,
          sorting: "scheduledDateTime desc",
          status: statusFilter || undefined,
          fromDate: fromDateFilter ? new Date(fromDateFilter).toISOString() : undefined,
          toDate: toDateFilter ? new Date(toDateFilter).toISOString() : undefined,
        }),
        patientsApi.getList({ maxResultCount: 1000 }),
      ])
      const filtered = appointmentsResult.items.filter((a) => {
        const matchesName =
          !nameFilter || a.patientFullName.toLowerCase().includes(nameFilter.toLowerCase())
        const matchesTreatmentType =
          !treatmentTypeFilter || a.treatmentType === TreatmentType[treatmentTypeFilter]
        return matchesName && matchesTreatmentType
      })
      setAppointments(filtered)
      setTotalCount(nameFilter || treatmentTypeFilter ? filtered.length : appointmentsResult.totalCount)
      setPatients(patientsResult.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách lịch hẹn")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCalendarRange = async (fromDate: string, toDate: string) => {
    try {
      const result = await appointmentsApi.getCalendarView(fromDate, toDate)
      setCalendarAppointments(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được lịch hẹn")
    }
  }

  const handleEventReschedule = async (appointmentId: string, newDateTime: string) => {
    const appointment = calendarAppointments.find((a) => a.id === appointmentId)
    if (!appointment) return

    try {
      await appointmentsApi.update(appointmentId, {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        scheduledDateTime: newDateTime,
        status: (Object.keys(AppointmentStatus) as AppointmentStatusName[]).find(
          (key) => AppointmentStatus[key] === appointment.status,
        ) ?? "Scheduled",
        treatmentType: (Object.keys(TreatmentType) as TreatmentTypeName[]).find(
          (key) => TreatmentType[key] === appointment.treatmentType,
        ) ?? "GeneralCheckup",
        preOpNotes: appointment.preOpNotes,
        postOpNotes: appointment.postOpNotes,
        price: appointment.price,
        prescriptionItems: appointment.prescriptionItems,
      })
      toast.success("Đã đổi giờ lịch hẹn")
      setCalendarAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, scheduledDateTime: newDateTime } : a)),
      )
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Đổi giờ thất bại")
      throw err
    }
  }

  const handleSelectSlot = (dateTime: string) => {
    if (patients.length === 0) return
    setEditingId(null)
    setForm({ ...emptyForm(patients[0]?.id ?? ""), scheduledDateTime: toLocalInputValue(dateTime) })
    setPrescriptionRows([])
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm(patients[0]?.id ?? ""))
    setPrescriptionRows([])
    setDialogOpen(true)
  }

  const openEditDialog = async (summary: AppointmentDto) => openEditDialogById(summary.id)

  const openEditDialogById = async (id: string) => {
    setEditingId(id)
    setDialogOpen(true)
    setIsLoadingDetail(true)

    // GetListAsync doesn't include PrescriptionItems (avoids an extra join for the table view),
    // so fetch the full detail via GetAsync before populating the form.
    let appointment: AppointmentDto
    try {
      appointment = await appointmentsApi.get(id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được chi tiết lịch hẹn")
      setDialogOpen(false)
      setIsLoadingDetail(false)
      return
    }
    setIsLoadingDetail(false)

    setForm({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      scheduledDateTime: toLocalInputValue(appointment.scheduledDateTime),
      status: (Object.keys(AppointmentStatus) as AppointmentStatusName[]).find(
        (key) => AppointmentStatus[key] === appointment.status,
      ) ?? "Scheduled",
      treatmentType: (Object.keys(TreatmentType) as TreatmentTypeName[]).find(
        (key) => TreatmentType[key] === appointment.treatmentType,
      ) ?? "GeneralCheckup",
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

  const handleDelete = async () => {
    if (!deletingAppointment) return
    setIsDeleting(true)
    try {
      await appointmentsApi.delete(deletingAppointment.id)
      toast.success("Đã xoá lịch hẹn")
      setDeletingAppointment(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  const openPaymentDialog = async (summary: AppointmentDto) => {
    try {
      const appointment = await appointmentsApi.get(summary.id)
      setPaymentDialogAppointment(appointment)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được chi tiết thanh toán")
    }
  }

  const handlePaymentChanged = (updated: AppointmentDto) => {
    setPaymentDialogAppointment(updated)
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lịch hẹn</h1>
          <p className="text-sm text-muted-foreground">{totalCount} lịch hẹn</p>
        </div>
        {patients.length === 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled>
                  <Plus />
                  Thêm lịch hẹn
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Cần thêm bệnh nhân trước khi tạo lịch hẹn</TooltipContent>
          </Tooltip>
        ) : (
          <Button onClick={openCreateDialog}>
            <Plus />
            Thêm lịch hẹn
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Input
          placeholder="Tìm theo tên bệnh nhân..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void loadData()}
          className="max-w-56"
        />
        <Select
          value={statusFilter || "all"}
          onValueChange={(value: string) =>
            setStatusFilter(value === "all" ? "" : (value as AppointmentStatusName))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi trạng thái</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {APPOINTMENT_STATUS_LABELS_VI[AppointmentStatus[status]]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={treatmentTypeFilter || "all"}
          onValueChange={(value: string) =>
            setTreatmentTypeFilter(value === "all" ? "" : (value as TreatmentTypeName))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Loại hình khám" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi loại hình khám</SelectItem>
            {TREATMENT_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {TREATMENT_TYPE_LABELS_VI[TreatmentType[type]]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          aria-label="Từ ngày"
          value={fromDateFilter}
          onChange={(e) => setFromDateFilter(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          aria-label="Đến ngày"
          value={toDateFilter}
          onChange={(e) => setToDateFilter(e.target.value)}
          className="w-40"
        />
        <Button variant="outline" onClick={() => void loadData()}>
          Lọc
        </Button>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Bảng</TabsTrigger>
          <TabsTrigger value="calendar">Lịch</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại hình khám</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full max-w-32" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!isLoading && appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CalendarPlus className="size-8" />
                        <p>Chưa có lịch hẹn nào.</p>
                        {patients.length > 0 && (
                          <Button variant="outline" size="sm" onClick={openCreateDialog}>
                            <Plus className="size-4" />
                            Thêm lịch hẹn đầu tiên
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.patientFullName}</TableCell>
                    <TableCell>
                      {new Date(appointment.scheduledDateTime).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>{TREATMENT_TYPE_LABELS_VI[appointment.treatmentType]}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {APPOINTMENT_STATUS_LABELS_VI[appointment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(appointment.price)}</TableCell>
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
                        aria-label={`Xem ảnh lịch hẹn của ${appointment.patientFullName}`}
                        onClick={() => setPhotosDialogAppointment(appointment)}
                      >
                        <Image className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Thanh toán"
                        aria-label={`Cập nhật thanh toán cho ${appointment.patientFullName}`}
                        onClick={() => void openPaymentDialog(appointment)}
                      >
                        <Wallet className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Sửa"
                        aria-label={`Sửa lịch hẹn của ${appointment.patientFullName}`}
                        onClick={() => void openEditDialog(appointment)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xoá"
                        aria-label={`Xoá lịch hẹn của ${appointment.patientFullName}`}
                        onClick={() => setDeletingAppointment(appointment)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <AppointmentCalendar
            appointments={calendarAppointments}
            onDateRangeChange={(fromDate, toDate) => void loadCalendarRange(fromDate, toDate)}
            onEventClick={(id) => void openEditDialogById(id)}
            onEventReschedule={handleEventReschedule}
            onSelectSlot={handleSelectSlot}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa lịch hẹn" : "Thêm lịch hẹn"}</DialogTitle>
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
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: AppointmentStatusName) =>
                    setForm({ ...form, status: value })
                  }
                >
                  <SelectTrigger id="status">
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
              <Label htmlFor="treatmentType">Loại hình khám</Label>
              <Select
                value={form.treatmentType}
                onValueChange={(value: TreatmentTypeName) =>
                  setForm({ ...form, treatmentType: value })
                }
              >
                <SelectTrigger id="treatmentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TREATMENT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {TREATMENT_TYPE_LABELS_VI[TreatmentType[type]]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <div
                  key={row.key}
                  className="grid grid-cols-2 gap-2 rounded-md border p-2 sm:grid-cols-[2fr_1fr_5rem_2fr_auto] sm:items-start sm:border-0 sm:p-0"
                >
                  <Input
                    placeholder="Tên thuốc"
                    aria-label="Tên thuốc"
                    className="col-span-2 sm:col-span-1"
                    value={row.data.drugName}
                    onChange={(e) => updatePrescriptionRow(row.key, { drugName: e.target.value })}
                  />
                  <Input
                    placeholder="Liều lượng"
                    aria-label="Liều lượng"
                    value={row.data.dosage ?? ""}
                    onChange={(e) => updatePrescriptionRow(row.key, { dosage: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="SL"
                    aria-label="Số lượng"
                    value={row.data.quantity}
                    onChange={(e) => updatePrescriptionRow(row.key, { quantity: Number(e.target.value) })}
                  />
                  <Input
                    placeholder="Hướng dẫn sử dụng"
                    aria-label="Hướng dẫn sử dụng"
                    className="col-span-2 sm:col-span-1"
                    value={row.data.instructions ?? ""}
                    onChange={(e) => updatePrescriptionRow(row.key, { instructions: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-2 justify-self-end sm:col-span-1"
                    title="Xoá dòng thuốc"
                    aria-label="Xoá dòng thuốc"
                    onClick={() => removePrescriptionRow(row.key)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving || isLoadingDetail}>
                {isSaving ? "Đang lưu..." : isLoadingDetail ? "Đang tải..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PaymentHistoryDialog
        appointment={paymentDialogAppointment}
        onOpenChange={(open) => !open && setPaymentDialogAppointment(null)}
        onChanged={handlePaymentChanged}
      />

      <AppointmentPhotosDialog
        appointmentId={photosDialogAppointment?.id ?? null}
        patientName={photosDialogAppointment?.patientFullName}
        onOpenChange={(open) => !open && setPhotosDialogAppointment(null)}
      />

      <ConfirmDialog
        open={deletingAppointment !== null}
        onOpenChange={(open) => !open && setDeletingAppointment(null)}
        title="Xoá lịch hẹn"
        description={`Bạn có chắc muốn xoá lịch hẹn của "${deletingAppointment?.patientFullName}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
