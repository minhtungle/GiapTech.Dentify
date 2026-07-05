import type { PagedAndSortedRequest } from "./common"

export const AppointmentStatus = {
  Scheduled: 0,
  InProgress: 1,
  Completed: 2,
  Cancelled: 3,
  NoShow: 4,
} as const
export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

export type AppointmentStatusName =
  | "Scheduled"
  | "InProgress"
  | "Completed"
  | "Cancelled"
  | "NoShow"

export const APPOINTMENT_STATUS_LABELS_VI: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Scheduled]: "Đã lên lịch",
  [AppointmentStatus.InProgress]: "Đang thực hiện",
  [AppointmentStatus.Completed]: "Hoàn thành",
  [AppointmentStatus.Cancelled]: "Đã huỷ",
  [AppointmentStatus.NoShow]: "Không đến",
}

export const PaymentStatus = {
  Unpaid: 0,
  PartiallyPaid: 1,
  Paid: 2,
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const PAYMENT_STATUS_LABELS_VI: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: "Chưa thanh toán",
  [PaymentStatus.PartiallyPaid]: "Thanh toán một phần",
  [PaymentStatus.Paid]: "Đã thanh toán",
}

export interface AppointmentDto {
  id: string
  patientId: string
  patientFullName: string
  doctorId?: string | null
  doctorName?: string | null
  scheduledDateTime: string
  status: AppointmentStatus
  preOpNotes?: string | null
  postOpNotes?: string | null
  prescription?: string | null
  price: number
  paidAmount: number
  paymentStatus: PaymentStatus
}

export interface CreateUpdateAppointmentDto {
  patientId: string
  doctorId?: string | null
  scheduledDateTime: string
  status: AppointmentStatusName
  preOpNotes?: string | null
  postOpNotes?: string | null
  prescription?: string | null
  price: number
}

export interface UpdatePaymentDto {
  paidAmount: number
}

export interface GetAppointmentListRequest extends PagedAndSortedRequest {
  patientId?: string
  doctorId?: string
  status?: AppointmentStatusName
  fromDate?: string
  toDate?: string
}
