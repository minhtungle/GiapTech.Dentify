import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import {
  CalendarPlus,
  ChevronDown,
  Download,
  FileText,
  Filter,
  Image,
  MailCheck,
  MoreVertical,
  Pencil,
  Pill,
  Plus,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { ConsentFormsDialog } from "@/components/appointments/ConsentFormsDialog"
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar"
import { PaymentHistoryDialog } from "@/components/appointments/PaymentHistoryDialog"
import { appointmentsApi } from "@/lib/appointments-api"
import { patientsApi } from "@/lib/patients-api"
import { doctorsApi } from "@/lib/doctors-api"
import { servicesApi } from "@/lib/services-api"
import { drugsApi } from "@/lib/drugs-api"
import { chairsApi } from "@/lib/chairs-api"
import { ApiError } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { downloadCsv, parseCsvToObjects, toCsv } from "@/lib/csv"
import { resolveEntityId } from "@/lib/csv-resolve"
import type {
  AppointmentDto,
  AppointmentStatusName,
  CreateUpdateAppointmentDto,
  CreateUpdatePrescriptionItemDto,
  PaymentStatusName,
} from "@/types/appointment"
import {
  APPOINTMENT_STATUS_LABELS_VI,
  AppointmentStatus,
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
  MAX_APPOINTMENT_DURATION_MINUTES,
  MIN_APPOINTMENT_DURATION_MINUTES,
  PAYMENT_STATUS_LABELS_VI,
  PaymentStatus,
} from "@/types/appointment"
import type { PatientDto } from "@/types/patient"
import type { DoctorDto } from "@/types/doctor"
import type { ServiceDto } from "@/types/service"
import type { DrugDto } from "@/types/drug"
import type { ChairDto } from "@/types/chair"

const STATUS_OPTIONS: AppointmentStatusName[] = [
  "Scheduled",
  "InProgress",
  "Completed",
  "Cancelled",
  "NoShow",
]

const PAYMENT_STATUS_OPTIONS: PaymentStatusName[] = ["Unpaid", "PartiallyPaid", "Paid"]

function emptyForm(patientId = ""): CreateUpdateAppointmentDto {
  return {
    patientId,
    doctorId: null,
    serviceId: null,
    chairId: null,
    scheduledDateTime: "",
    durationMinutes: DEFAULT_APPOINTMENT_DURATION_MINUTES,
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
    data: { drugId: null, drugName: "", dosage: "", quantity: 1, instructions: "" },
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
  const [doctors, setDoctors] = useState<DoctorDto[]>([])
  const [services, setServices] = useState<ServiceDto[]>([])
  const [drugs, setDrugs] = useState<DrugDto[]>([])
  const [chairs, setChairs] = useState<ChairDto[]>([])
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

  const [consentFormsDialogAppointment, setConsentFormsDialogAppointment] =
    useState<AppointmentDto | null>(null)

  const [deletingAppointment, setDeletingAppointment] = useState<AppointmentDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [calendarAppointments, setCalendarAppointments] = useState<AppointmentDto[]>([])
  const calendarRequestIdRef = useRef(0)

  const [isImporting, setIsImporting] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [nameFilter, setNameFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusName | "">("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusName | "">("")
  const [serviceFilter, setServiceFilter] = useState<string>("")
  const [chairFilter, setChairFilter] = useState<string>("")
  const [fromDateFilter, setFromDateFilter] = useState("")
  const [toDateFilter, setToDateFilter] = useState("")

  const activeAdvancedFilterCount = [
    statusFilter,
    serviceFilter,
    chairFilter,
    paymentStatusFilter,
    fromDateFilter,
    toDateFilter,
  ].filter(Boolean).length

  const [selectedPatientNoShowCount, setSelectedPatientNoShowCount] = useState<number | null>(null)
  const selectedPatient = patients.find((p) => p.id === form.patientId) ?? null

  useEffect(() => {
    if (!dialogOpen || !form.patientId) {
      setSelectedPatientNoShowCount(null)
      return
    }
    let cancelled = false
    patientsApi
      .getDetail(form.patientId)
      .then((detail) => {
        if (!cancelled) setSelectedPatientNoShowCount(detail.noShowCount)
      })
      .catch(() => {
        if (!cancelled) setSelectedPatientNoShowCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [dialogOpen, form.patientId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [appointmentsResult, patientsResult, doctorsResult, servicesResult, drugsResult, chairsResult] = await Promise.all([
        appointmentsApi.getList({
          maxResultCount: 100,
          sorting: "scheduledDateTime desc",
          status: statusFilter || undefined,
          paymentStatus: paymentStatusFilter || undefined,
          serviceId: serviceFilter || undefined,
          chairId: chairFilter || undefined,
          fromDate: fromDateFilter ? new Date(fromDateFilter).toISOString() : undefined,
          toDate: toDateFilter ? new Date(toDateFilter).toISOString() : undefined,
        }),
        patientsApi.getList({ maxResultCount: 1000 }),
        doctorsApi.getActiveList(),
        servicesApi.getActiveList(),
        drugsApi.getActiveList(),
        chairsApi.getActiveList(),
      ])
      const filtered = appointmentsResult.items.filter(
        (a) => !nameFilter || a.patientFullName.toLowerCase().includes(nameFilter.toLowerCase()),
      )
      setAppointments(filtered)
      setTotalCount(nameFilter ? filtered.length : appointmentsResult.totalCount)
      setPatients(patientsResult.items)
      setDoctors(doctorsResult)
      setServices(servicesResult)
      setDrugs(drugsResult)
      setChairs(chairsResult)
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
    // Điều hướng nhanh (bấm prev/next liên tiếp) gửi nhiều request chồng nhau — response
    // không đảm bảo về đúng thứ tự gửi đi, nên response của 1 khoảng ngày đã rời khỏi có
    // thể về sau và ghi đè dữ liệu đúng của request mới nhất. Chỉ áp dụng response nếu nó
    // vẫn là request mới nhất tại thời điểm về.
    const requestId = ++calendarRequestIdRef.current
    try {
      const result = await appointmentsApi.getCalendarView(fromDate, toDate)
      if (requestId !== calendarRequestIdRef.current) return
      setCalendarAppointments(result)
    } catch (err) {
      if (requestId !== calendarRequestIdRef.current) return
      toast.error(err instanceof ApiError ? err.message : "Không tải được lịch hẹn")
    }
  }

  const handleEventReschedule = async (
    appointmentId: string,
    newDateTime: string,
    newChairId?: string | null,
  ) => {
    const appointment = calendarAppointments.find((a) => a.id === appointmentId)
    if (!appointment) return

    const chairId = newChairId === undefined ? appointment.chairId : newChairId

    try {
      await appointmentsApi.update(appointmentId, {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        serviceId: appointment.serviceId,
        chairId,
        scheduledDateTime: newDateTime,
        durationMinutes: appointment.durationMinutes,
        status: (Object.keys(AppointmentStatus) as AppointmentStatusName[]).find(
          (key) => AppointmentStatus[key] === appointment.status,
        ) ?? "Scheduled",
        preOpNotes: appointment.preOpNotes,
        postOpNotes: appointment.postOpNotes,
        price: appointment.price,
        prescriptionItems: appointment.prescriptionItems,
      })
      toast.success("Đã đổi giờ lịch hẹn")
      setCalendarAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, scheduledDateTime: newDateTime, chairId } : a,
        ),
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
      serviceId: appointment.serviceId,
      chairId: appointment.chairId,
      scheduledDateTime: toLocalInputValue(appointment.scheduledDateTime),
      durationMinutes: appointment.durationMinutes,
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
          drugId: item.drugId,
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

  const handleExportCsv = async () => {
    try {
      const result = await appointmentsApi.getList({ maxResultCount: 1000, sorting: "scheduledDateTime desc" })
      const csv = toCsv(
        [
          "Bệnh nhân",
          "PatientId",
          "Bác sĩ",
          "DoctorId",
          "Dịch vụ",
          "ServiceId",
          "Ghế",
          "ChairId",
          "Thời gian hẹn",
          "Thời lượng (phút)",
          "Trạng thái",
          "Giá",
          "Ghi chú trước điều trị",
          "Ghi chú sau điều trị",
        ],
        result.items.map((a) => [
          a.patientFullName,
          a.patientId,
          a.doctorName ?? "",
          a.doctorId ?? "",
          a.serviceName ?? "",
          a.serviceId ?? "",
          a.chairName ?? "",
          a.chairId ?? "",
          a.scheduledDateTime,
          a.durationMinutes,
          APPOINTMENT_STATUS_LABELS_VI[a.status],
          a.price,
          a.preOpNotes ?? "",
          a.postOpNotes ?? "",
        ]),
      )
      downloadCsv(`lich-hen-${new Date().toISOString().slice(0, 10)}.csv`, csv)
      toast.success(`Đã xuất ${result.items.length} lịch hẹn ra CSV`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xuất CSV thất bại")
    }
  }

  const handleImportCsv = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const text = await file.text()
    const rows = parseCsvToObjects(text)
    if (rows.length === 0) {
      toast.error("File CSV không có dữ liệu")
      return
    }

    setIsImporting(true)
    let successCount = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const scheduledDateTime = row["Thời gian hẹn"]?.trim()
      const durationText = row["Thời lượng (phút)"]?.trim()
      const durationMinutes = Number(durationText)
      const priceText = row["Giá"]?.trim()
      const price = Number(priceText)

      if (!scheduledDateTime || Number.isNaN(new Date(scheduledDateTime).getTime())) {
        errors.push(`Dòng ${i + 2}: Thời gian hẹn không hợp lệ`)
        continue
      }
      if (!durationText || Number.isNaN(durationMinutes) || durationMinutes <= 0) {
        errors.push(`Dòng ${i + 2}: Thời lượng không hợp lệ`)
        continue
      }
      if (!priceText || Number.isNaN(price) || price < 0) {
        errors.push(`Dòng ${i + 2}: Giá không hợp lệ`)
        continue
      }

      const patientResult = resolveEntityId(patients, row["PatientId"], row["Bệnh nhân"], (p) => p.fullName)
      if (!patientResult.id) {
        errors.push(`Dòng ${i + 2}: Bệnh nhân ${patientResult.error ?? "bị thiếu"}`)
        continue
      }

      const doctorResult = resolveEntityId(doctors, row["DoctorId"], row["Bác sĩ"], (d) => d.fullName)
      const serviceResult = resolveEntityId(services, row["ServiceId"], row["Dịch vụ"], (s) => s.name)
      const chairResult = resolveEntityId(chairs, row["ChairId"], row["Ghế"], (c) => c.name)

      // Doctor/Service/Chair là optional — chỉ cảnh báo (không chặn dòng) khi người dùng
      // CÓ ghi tên nhưng không resolve được (không tìm thấy/trùng nhiều); ô để trống hợp
      // lệ (error === null, id === null) thì vẫn tạo appointment không có field đó.
      const optionalFieldWarnings = [
        doctorResult.error && `Bác sĩ ${doctorResult.error}`,
        serviceResult.error && `Dịch vụ ${serviceResult.error}`,
        chairResult.error && `Ghế ${chairResult.error}`,
      ].filter((w): w is string => Boolean(w))
      if (optionalFieldWarnings.length > 0) {
        errors.push(`Dòng ${i + 2}: ${optionalFieldWarnings.join("; ")} (đã bỏ qua, vẫn tạo lịch hẹn)`)
      }

      const statusLabel = row["Trạng thái"]?.trim()
      const statusName =
        STATUS_OPTIONS.find((s) => APPOINTMENT_STATUS_LABELS_VI[AppointmentStatus[s]] === statusLabel) ??
        "Scheduled"

      try {
        await appointmentsApi.create({
          patientId: patientResult.id,
          doctorId: doctorResult.id,
          serviceId: serviceResult.id,
          chairId: chairResult.id,
          scheduledDateTime: new Date(scheduledDateTime).toISOString(),
          durationMinutes,
          status: statusName,
          preOpNotes: row["Ghi chú trước điều trị"]?.trim() || undefined,
          postOpNotes: row["Ghi chú sau điều trị"]?.trim() || undefined,
          price,
          prescriptionItems: [],
        })
        successCount++
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Lỗi không xác định"
        errors.push(`Dòng ${i + 2}: ${message}`)
      }
    }

    setIsImporting(false)

    if (successCount > 0) {
      toast.success(`Đã nhập ${successCount}/${rows.length} lịch hẹn`)
      await loadData()
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} dòng lỗi: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "..." : ""}`)
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
        <div className="flex gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            aria-label="Chọn file CSV để nhập"
            className="hidden"
            onChange={(e) => void handleImportCsv(e)}
          />
          <Button
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="size-4" />
            {isImporting ? "Đang nhập..." : "Nhập CSV"}
          </Button>
          <Button variant="outline" onClick={() => void handleExportCsv()} disabled={isImporting}>
            <Download className="size-4" />
            Xuất CSV
          </Button>
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
      </div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            placeholder="Tìm theo tên bệnh nhân..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void loadData()}
            className="max-w-56"
          />
          <CollapsibleTrigger asChild>
            <Button variant="outline" type="button">
              <Filter className="size-4" />
              Bộ lọc
              {activeAdvancedFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeAdvancedFilterCount}
                </Badge>
              )}
              <ChevronDown
                className={`size-4 transition-transform ${isFiltersOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="mt-2 flex flex-wrap items-end gap-2">
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
              value={serviceFilter || "all"}
              onValueChange={(value: string) => setServiceFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Dịch vụ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi dịch vụ</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={chairFilter || "all"}
              onValueChange={(value: string) => setChairFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Ghế" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi ghế</SelectItem>
                {chairs.map((chair) => (
                  <SelectItem key={chair.id} value={chair.id}>
                    {chair.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={paymentStatusFilter || "all"}
              onValueChange={(value: string) =>
                setPaymentStatusFilter(value === "all" ? "" : (value as PaymentStatusName))
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi trạng thái thanh toán</SelectItem>
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PAYMENT_STATUS_LABELS_VI[PaymentStatus[status]]}
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
        </CollapsibleContent>
      </Collapsible>

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
                  <TableHead>Dịch vụ</TableHead>
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
                    <TableCell>{appointment.serviceName ?? "Chưa phân loại"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {APPOINTMENT_STATUS_LABELS_VI[appointment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(appointment.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
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
                        {appointment.reminderSentAt && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <MailCheck
                                className="size-4 text-muted-foreground"
                                aria-label={`Đã gửi email nhắc hẹn lúc ${new Date(appointment.reminderSentAt).toLocaleString("vi-VN")}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              Đã nhắc hẹn qua email lúc{" "}
                              {new Date(appointment.reminderSentAt).toLocaleString("vi-VN")}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Hành động cho lịch hẹn của ${appointment.patientFullName}`}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPhotosDialogAppointment(appointment)}>
                            <Image className="size-4" />
                            Ảnh lịch hẹn
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setConsentFormsDialogAppointment(appointment)}
                          >
                            <FileText className="size-4" />
                            Phiếu đồng ý
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void openPaymentDialog(appointment)}>
                            <Wallet className="size-4" />
                            Thanh toán
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void openEditDialog(appointment)}>
                            <Pencil className="size-4" />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingAppointment(appointment)}
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
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa lịch hẹn" : "Thêm lịch hẹn"}</DialogTitle>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
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
              {selectedPatient && (selectedPatient.allergies.length > 0 || selectedPatient.medicalConditions.length > 0) && (
                <div className="flex flex-wrap gap-1">
                  {selectedPatient.allergies.map((allergy) => (
                    <Badge key={allergy} variant="destructive">
                      Dị ứng: {allergy}
                    </Badge>
                  ))}
                  {selectedPatient.medicalConditions.map((condition) => (
                    <Badge key={condition} variant="warning">
                      {condition}
                    </Badge>
                  ))}
                </div>
              )}
              {selectedPatientNoShowCount !== null && selectedPatientNoShowCount > 0 && (
                <p className="text-sm text-destructive">
                  Bệnh nhân này đã không đến {selectedPatientNoShowCount} lần trước đó.
                </p>
              )}
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
                <Label htmlFor="durationMinutes">Thời lượng (phút)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min={MIN_APPOINTMENT_DURATION_MINUTES}
                  max={MAX_APPOINTMENT_DURATION_MINUTES}
                  required
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="doctorId">Bác sĩ phụ trách</Label>
                <Select
                  value={form.doctorId ?? "none"}
                  onValueChange={(value: string) =>
                    setForm({ ...form, doctorId: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger id="doctorId">
                    <SelectValue placeholder="Chọn bác sĩ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Chưa chỉ định</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="serviceId">Dịch vụ</Label>
                <Select
                  value={form.serviceId ?? "none"}
                  onValueChange={(value: string) =>
                    setForm({ ...form, serviceId: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger id="serviceId">
                    <SelectValue placeholder="Chọn dịch vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Chưa phân loại</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chairId">Ghế</Label>
                <Select
                  value={form.chairId ?? "none"}
                  onValueChange={(value: string) =>
                    setForm({ ...form, chairId: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger id="chairId">
                    <SelectValue placeholder="Chọn ghế" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Chưa xếp ghế</SelectItem>
                    {chairs.map((chair) => (
                      <SelectItem key={chair.id} value={chair.id}>
                        {chair.name}
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
                <div
                  key={row.key}
                  className="grid grid-cols-2 gap-2 rounded-md border p-2 sm:grid-cols-[2fr_1fr_5rem_2fr_auto] sm:items-start sm:border-0 sm:p-0"
                >
                  <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                    <Select
                      value={row.data.drugId ?? "custom"}
                      onValueChange={(value: string) => {
                        if (value === "custom") {
                          updatePrescriptionRow(row.key, { drugId: null })
                          return
                        }
                        const drug = drugs.find((d) => d.id === value)
                        updatePrescriptionRow(row.key, {
                          drugId: value,
                          drugName: drug?.name ?? row.data.drugName,
                          dosage: drug?.defaultDosage ?? row.data.dosage,
                        })
                      }}
                    >
                      <SelectTrigger aria-label="Chọn thuốc từ danh mục">
                        <SelectValue placeholder="Chọn thuốc" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Nhập tên khác</SelectItem>
                        {drugs.map((drug) => (
                          <SelectItem key={drug.id} value={drug.id}>
                            {drug.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Tên thuốc"
                      aria-label="Tên thuốc"
                      value={row.data.drugName}
                      onChange={(e) => updatePrescriptionRow(row.key, { drugName: e.target.value })}
                    />
                  </div>
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
            </DialogBody>

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

      <ConsentFormsDialog
        appointmentId={consentFormsDialogAppointment?.id ?? null}
        patientName={consentFormsDialogAppointment?.patientFullName}
        onOpenChange={(open) => !open && setConsentFormsDialogAppointment(null)}
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
