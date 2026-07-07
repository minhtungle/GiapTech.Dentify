import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { appointmentsApi } from "@/lib/appointments-api"
import { clinicSettingsApi } from "@/lib/clinic-settings-api"
import { ApiError } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { AppointmentDto } from "@/types/appointment"
import {
  APPOINTMENT_STATUS_LABELS_VI,
  PAYMENT_METHOD_LABELS_VI,
  PAYMENT_STATUS_LABELS_VI,
  TREATMENT_TYPE_LABELS_VI,
} from "@/types/appointment"
import type { ClinicSettingsDto } from "@/types/clinicSettings"

export function InvoicePage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const [appointment, setAppointment] = useState<AppointmentDto | null>(null)
  const [clinic, setClinic] = useState<ClinicSettingsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!appointmentId) return
    void (async () => {
      setIsLoading(true)
      try {
        const [appointmentResult, clinicResult] = await Promise.all([
          appointmentsApi.get(appointmentId),
          clinicSettingsApi.get().catch(() => null),
        ])
        setAppointment(appointmentResult)
        setClinic(clinicResult)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Không tải được hoá đơn")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [appointmentId])

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Đang tải hoá đơn...</div>
  }

  if (!appointment) {
    return <div className="p-8 text-center text-muted-foreground">Không tìm thấy lịch hẹn.</div>
  }

  const sortedPayments = appointment.payments
    .slice()
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8 print:p-0">
      <div className="flex justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          In hoá đơn
        </Button>
      </div>

      <div className="flex flex-col gap-1 border-b pb-4 text-center">
        {clinic?.logoUrl && (
          <img src={clinic.logoUrl} alt="Logo" className="mx-auto mb-2 h-16 object-contain" />
        )}
        <h1 className="text-xl font-bold">{clinic?.name || "Phòng khám Nha khoa"}</h1>
        {clinic?.address && <p className="text-sm text-muted-foreground">{clinic.address}</p>}
        {clinic?.phoneNumber && (
          <p className="text-sm text-muted-foreground">ĐT: {clinic.phoneNumber}</p>
        )}
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold uppercase">Hoá đơn thanh toán</h2>
        <p className="text-sm text-muted-foreground">
          Mã lịch hẹn: {appointment.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Bệnh nhân</p>
          <p className="font-medium">{appointment.patientFullName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Bác sĩ</p>
          <p className="font-medium">{appointment.doctorName ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ngày khám</p>
          <p className="font-medium">
            {new Date(appointment.scheduledDateTime).toLocaleString("vi-VN")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Loại hình khám</p>
          <p className="font-medium">{TREATMENT_TYPE_LABELS_VI[appointment.treatmentType]}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Trạng thái lịch hẹn</p>
          <p className="font-medium">{APPOINTMENT_STATUS_LABELS_VI[appointment.status]}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Trạng thái thanh toán</p>
          <p className="font-medium">{PAYMENT_STATUS_LABELS_VI[appointment.paymentStatus]}</p>
        </div>
      </div>

      {appointment.prescriptionItems.length > 0 && (
        <div>
          <h3 className="mb-2 border-b pb-1 font-semibold">Đơn thuốc</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 pr-2">Tên thuốc</th>
                <th className="py-1 pr-2">Liều lượng</th>
                <th className="py-1 pr-2 text-right">SL</th>
                <th className="py-1">Hướng dẫn</th>
              </tr>
            </thead>
            <tbody>
              {appointment.prescriptionItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="py-1 pr-2">{item.drugName}</td>
                  <td className="py-1 pr-2">{item.dosage ?? "—"}</td>
                  <td className="py-1 pr-2 text-right">{item.quantity}</td>
                  <td className="py-1">{item.instructions ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="mb-2 border-b pb-1 font-semibold">Chi tiết thanh toán</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-2">Ngày</th>
              <th className="py-1 pr-2">Phương thức</th>
              <th className="py-1 pr-2">Ghi chú</th>
              <th className="py-1 text-right">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            {sortedPayments.length === 0 && (
              <tr className="border-t">
                <td colSpan={4} className="py-2 text-center text-muted-foreground">
                  Chưa có lần thanh toán nào.
                </td>
              </tr>
            )}
            {sortedPayments.map((payment) => (
              <tr key={payment.id} className="border-t">
                <td className="py-1 pr-2">{new Date(payment.paymentDate).toLocaleString("vi-VN")}</td>
                <td className="py-1 pr-2">{PAYMENT_METHOD_LABELS_VI[payment.method]}</td>
                <td className="py-1 pr-2">{payment.notes ?? "—"}</td>
                <td className="py-1 text-right">{formatCurrency(payment.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ml-auto flex w-full max-w-xs flex-col gap-1 border-t pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Giá dịch vụ</span>
          <span className="font-medium">{formatCurrency(appointment.price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Đã thanh toán</span>
          <span className="font-medium">{formatCurrency(appointment.paidAmount)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Còn lại</span>
          <span>{formatCurrency(appointment.price - appointment.paidAmount)}</span>
        </div>
      </div>

      <p className="pt-6 text-center text-xs text-muted-foreground">
        Cảm ơn quý khách đã sử dụng dịch vụ.
      </p>
    </div>
  )
}
