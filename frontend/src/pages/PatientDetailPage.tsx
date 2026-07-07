import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AlertCircle, ArrowLeft, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PatientToothChartPanel } from "@/components/tooth-chart/PatientToothChartPanel"
import { PaymentHistoryDialog } from "@/components/appointments/PaymentHistoryDialog"
import { patientsApi } from "@/lib/patients-api"
import { appointmentsApi } from "@/lib/appointments-api"
import { labWorksApi } from "@/lib/lab-works-api"
import { ApiError } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { PatientDetailDto } from "@/types/patient"
import type { AppointmentDto } from "@/types/appointment"
import {
  APPOINTMENT_STATUS_LABELS_VI,
  PAYMENT_STATUS_LABELS_VI,
  TREATMENT_TYPE_LABELS_VI,
} from "@/types/appointment"
import type { LabWorkDto } from "@/types/labWork"
import { LAB_WORK_STATUS_LABELS_VI } from "@/types/labWork"

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const monthDiff = now.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--
  }
  return age
}

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<PatientDetailDto | null>(null)
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [labWorks, setLabWorks] = useState<LabWorkDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [paymentDialogAppointment, setPaymentDialogAppointment] =
    useState<AppointmentDto | null>(null)

  const loadData = async () => {
    if (!patientId) return
    setIsLoading(true)
    setLoadError(false)
    try {
      const [detailResult, appointmentsResult, labWorksResult] = await Promise.all([
        patientsApi.getDetail(patientId),
        appointmentsApi.getList({
          patientId,
          maxResultCount: 100,
          sorting: "scheduledDateTime desc",
        }),
        labWorksApi.getList({ patientId, maxResultCount: 100 }),
      ])
      setDetail(detailResult)
      setAppointments(appointmentsResult.items)
      setLabWorks(labWorksResult.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được hồ sơ bệnh nhân")
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

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

  if (!patientId) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          title="Quay lại"
          aria-label="Quay lại danh sách bệnh nhân"
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : detail ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{detail.patient.fullName}</h1>
              {detail.patient.isChildPatient && <Badge variant="secondary">Trẻ em</Badge>}
              {detail.totalDebt > 0 && (
                <Badge variant="destructive">Còn nợ {formatCurrency(detail.totalDebt)}</Badge>
              )}
              {detail.noShowCount > 0 && (
                <Badge variant="warning">Không đến {detail.noShowCount} lần</Badge>
              )}
              {detail.patient.allergies.map((allergy) => (
                <Badge key={allergy} variant="destructive">
                  Dị ứng: {allergy}
                </Badge>
              ))}
              {detail.patient.medicalConditions.map((condition) => (
                <Badge key={condition} variant="warning">
                  {condition}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {calculateAge(detail.patient.dateOfBirth)} tuổi
              {detail.patient.phoneNumber ? ` · ${detail.patient.phoneNumber}` : ""}
              {detail.lastAppointmentDate
                ? ` · Lần khám gần nhất: ${new Date(detail.lastAppointmentDate).toLocaleDateString("vi-VN")}`
                : ""}
            </p>
          </div>
        ) : null}
      </div>

      {!isLoading && loadError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-10 text-muted-foreground">
          <AlertCircle className="size-8" />
          <p>Không tải được hồ sơ bệnh nhân. Vui lòng thử lại.</p>
          <Button variant="outline" size="sm" onClick={() => void loadData()}>
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !loadError && detail && (
        <Tabs defaultValue="appointments">
          <TabsList>
            <TabsTrigger value="appointments">Lịch hẹn ({appointments.length})</TabsTrigger>
            <TabsTrigger value="payments">Thanh toán</TabsTrigger>
            <TabsTrigger value="lab-works">Ca labo ({labWorks.length})</TabsTrigger>
            <TabsTrigger value="tooth-chart">Sơ đồ răng</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại hình khám</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Thanh toán</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Chưa có lịch hẹn nào.
                      </TableCell>
                    </TableRow>
                  )}
                  {appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.scheduledDateTime).toLocaleString("vi-VN")}</TableCell>
                      <TableCell>{TREATMENT_TYPE_LABELS_VI[a.treatmentType]}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{APPOINTMENT_STATUS_LABELS_VI[a.status]}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(a.price)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.paymentStatus === 2
                              ? "success"
                              : a.paymentStatus === 1
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {PAYMENT_STATUS_LABELS_VI[a.paymentStatus]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Đã trả</TableHead>
                    <TableHead>Còn nợ</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Chưa có lịch hẹn nào.
                      </TableCell>
                    </TableRow>
                  )}
                  {appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.scheduledDateTime).toLocaleString("vi-VN")}</TableCell>
                      <TableCell>{formatCurrency(a.price)}</TableCell>
                      <TableCell>{formatCurrency(a.paidAmount)}</TableCell>
                      <TableCell
                        className={a.price - a.paidAmount > 0 ? "font-medium text-destructive" : ""}
                      >
                        {formatCurrency(a.price - a.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Thanh toán"
                          aria-label={`Xem thanh toán lịch hẹn ngày ${new Date(a.scheduledDateTime).toLocaleDateString("vi-VN")}`}
                          onClick={() => void openPaymentDialog(a)}
                        >
                          <Wallet className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="lab-works">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Labo</TableHead>
                    <TableHead>Loại việc</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead>Ngày nhận dự kiến</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Chi phí</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labWorks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Chưa có ca labo nào.
                      </TableCell>
                    </TableRow>
                  )}
                  {labWorks.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.labName}</TableCell>
                      <TableCell>{l.workType}</TableCell>
                      <TableCell>{new Date(l.sentDate).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell>
                        {l.expectedReceiveDate
                          ? new Date(l.expectedReceiveDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{LAB_WORK_STATUS_LABELS_VI[l.status]}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(l.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="tooth-chart">
            <PatientToothChartPanel patientId={patientId} />
          </TabsContent>
        </Tabs>
      )}

      <PaymentHistoryDialog
        appointment={paymentDialogAppointment}
        onOpenChange={(open) => !open && setPaymentDialogAppointment(null)}
        onChanged={handlePaymentChanged}
      />
    </div>
  )
}
