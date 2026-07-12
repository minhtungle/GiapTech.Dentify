import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { Printer, Trash2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { appointmentsApi } from "@/lib/appointments-api"
import { ApiError } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { AppointmentDto, CreatePaymentDto, PaymentDto, PaymentMethodName } from "@/types/appointment"
import { PAYMENT_METHOD_LABELS_VI, PAYMENT_STATUS_LABELS_VI, PaymentMethod } from "@/types/appointment"

const PAYMENT_METHOD_OPTIONS: PaymentMethodName[] = [
  "Cash",
  "BankTransfer",
  "CreditCard",
  "Other",
]

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function emptyPaymentForm(): CreatePaymentDto {
  return {
    amount: 0,
    paymentDate: toLocalInputValue(new Date()),
    method: "Cash",
    notes: "",
  }
}

interface PaymentHistoryDialogProps {
  appointment: AppointmentDto | null
  onOpenChange: (open: boolean) => void
  onChanged: (updated: AppointmentDto) => void
}

export function PaymentHistoryDialog({
  appointment,
  onOpenChange,
  onChanged,
}: PaymentHistoryDialogProps) {
  const [form, setForm] = useState<CreatePaymentDto>(emptyPaymentForm())
  const [isSaving, setIsSaving] = useState(false)
  const [deletingPayment, setDeletingPayment] = useState<PaymentDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const remaining = appointment ? appointment.price - appointment.paidAmount : 0

  const handleAddPayment = async (e: FormEvent) => {
    e.preventDefault()
    if (!appointment) return
    setIsSaving(true)
    try {
      const updated = await appointmentsApi.addPayment(appointment.id, {
        ...form,
        paymentDate: new Date(form.paymentDate).toISOString(),
      })
      toast.success("Đã ghi nhận thanh toán")
      onChanged(updated)
      setForm(emptyPaymentForm())
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Ghi nhận thanh toán thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePayment = async () => {
    if (!appointment || !deletingPayment) return
    setIsDeleting(true)
    try {
      const updated = await appointmentsApi.removePayment(appointment.id, deletingPayment.id)
      toast.success("Đã xoá lần thanh toán")
      onChanged(updated)
      setDeletingPayment(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={appointment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Thanh toán{appointment ? ` — ${appointment.patientFullName}` : ""}
          </DialogTitle>
        </DialogHeader>

        {appointment && (
          <DialogBody className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-sm">
              <div>
                <p className="text-muted-foreground">Giá dịch vụ</p>
                <p className="font-medium">{formatCurrency(appointment.price)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Đã thanh toán</p>
                <p className="font-medium">{formatCurrency(appointment.paidAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Còn lại</p>
                <p className="font-medium">{formatCurrency(remaining)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
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
              <Button variant="outline" size="sm" asChild>
                <Link to={`/appointments/${appointment.id}/invoice`} target="_blank">
                  <Printer className="size-4" />
                  In hoá đơn
                </Link>
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Lịch sử thanh toán</Label>
              {appointment.payments.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có lần thanh toán nào.</p>
              )}
              {appointment.payments.length > 0 && (
                <div className="flex flex-col gap-2">
                  {appointment.payments
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
                    )
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="size-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.paymentDate).toLocaleString("vi-VN")} ·{" "}
                              {PAYMENT_METHOD_LABELS_VI[payment.method]}
                              {payment.notes ? ` · ${payment.notes}` : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xoá lần thanh toán"
                          aria-label={`Xoá lần thanh toán ${formatCurrency(payment.amount)}`}
                          onClick={() => setDeletingPayment(payment)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </DialogBody>
        )}

        {appointment && remaining > 0 && (
          <form onSubmit={handleAddPayment} className="flex flex-col gap-3 rounded-lg border p-3">
            <Label className="text-sm font-medium">Thêm lần thanh toán mới</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="paymentAmount">Số tiền</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min={0.01}
                  max={remaining}
                  step="0.01"
                  required
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="paymentDate">Ngày thanh toán</Label>
                <Input
                  id="paymentDate"
                  type="datetime-local"
                  required
                  value={form.paymentDate}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="paymentMethod">Phương thức</Label>
              <Select
                value={form.method}
                onValueChange={(value: PaymentMethodName) => setForm({ ...form, method: value })}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS_VI[PaymentMethod[method]]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="paymentNotes">Ghi chú</Label>
              <Textarea
                id="paymentNotes"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {form.amount > remaining && (
              <p className="text-sm text-destructive">
                Số tiền không được vượt quá số còn lại ({formatCurrency(remaining)}).
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isSaving || form.amount <= 0 || form.amount > remaining}>
                {isSaving ? "Đang lưu..." : "Ghi nhận thanh toán"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>

      <ConfirmDialog
        open={deletingPayment !== null}
        onOpenChange={(open) => !open && setDeletingPayment(null)}
        title="Xoá lần thanh toán"
        description={`Bạn có chắc muốn xoá lần thanh toán ${deletingPayment ? formatCurrency(deletingPayment.amount) : ""}? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDeletePayment()}
      />
    </Dialog>
  )
}
