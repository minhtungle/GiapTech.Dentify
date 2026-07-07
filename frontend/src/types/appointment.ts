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

export const TreatmentType = {
  GeneralCheckup: 0,
  Filling: 1,
  Extraction: 2,
  Whitening: 3,
  RootCanal: 4,
  Orthodontics: 5,
  Implant: 6,
  Cleaning: 7,
  Crown: 8,
  Other: 9,
} as const
export type TreatmentType = (typeof TreatmentType)[keyof typeof TreatmentType]

export type TreatmentTypeName =
  | "GeneralCheckup"
  | "Filling"
  | "Extraction"
  | "Whitening"
  | "RootCanal"
  | "Orthodontics"
  | "Implant"
  | "Cleaning"
  | "Crown"
  | "Other"

export const TREATMENT_TYPE_LABELS_VI: Record<TreatmentType, string> = {
  [TreatmentType.GeneralCheckup]: "Khám tổng quát",
  [TreatmentType.Filling]: "Trám răng",
  [TreatmentType.Extraction]: "Nhổ răng",
  [TreatmentType.Whitening]: "Tẩy trắng răng",
  [TreatmentType.RootCanal]: "Điều trị tuỷ",
  [TreatmentType.Orthodontics]: "Chỉnh nha",
  [TreatmentType.Implant]: "Cấy ghép Implant",
  [TreatmentType.Cleaning]: "Cạo vôi răng",
  [TreatmentType.Crown]: "Bọc răng sứ",
  [TreatmentType.Other]: "Khác",
}

export const PaymentMethod = {
  Cash: 0,
  BankTransfer: 1,
  CreditCard: 2,
  Other: 3,
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export type PaymentMethodName =
  | "Cash"
  | "BankTransfer"
  | "CreditCard"
  | "Other"

export const PAYMENT_METHOD_LABELS_VI: Record<PaymentMethod, string> = {
  [PaymentMethod.Cash]: "Tiền mặt",
  [PaymentMethod.BankTransfer]: "Chuyển khoản",
  [PaymentMethod.CreditCard]: "Thẻ tín dụng",
  [PaymentMethod.Other]: "Khác",
}

export interface PaymentDto {
  id: string
  appointmentId: string
  amount: number
  paymentDate: string
  method: PaymentMethod
  notes?: string | null
  creationTime: string
}

export interface CreatePaymentDto {
  amount: number
  paymentDate: string
  method: PaymentMethodName
  notes?: string | null
}

export interface PrescriptionItemDto {
  id: string
  appointmentId: string
  drugName: string
  dosage?: string | null
  quantity: number
  instructions?: string | null
}

export interface CreateUpdatePrescriptionItemDto {
  id?: string | null
  drugName: string
  dosage?: string | null
  quantity: number
  instructions?: string | null
}

export interface AppointmentDto {
  id: string
  patientId: string
  patientFullName: string
  doctorId?: string | null
  doctorName?: string | null
  scheduledDateTime: string
  status: AppointmentStatus
  treatmentType: TreatmentType
  preOpNotes?: string | null
  postOpNotes?: string | null
  price: number
  paidAmount: number
  paymentStatus: PaymentStatus
  prescriptionItems: PrescriptionItemDto[]
  payments: PaymentDto[]
}

export interface CreateUpdateAppointmentDto {
  patientId: string
  doctorId?: string | null
  scheduledDateTime: string
  status: AppointmentStatusName
  treatmentType: TreatmentTypeName
  preOpNotes?: string | null
  postOpNotes?: string | null
  price: number
  prescriptionItems: CreateUpdatePrescriptionItemDto[]
}

export interface GetAppointmentListRequest extends PagedAndSortedRequest {
  patientId?: string
  doctorId?: string
  status?: AppointmentStatusName
  fromDate?: string
  toDate?: string
}
