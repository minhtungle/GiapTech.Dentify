import type { PagedAndSortedRequest } from "./common"

export const LabWorkStatus = {
  Sent: 0,
  InProgress: 1,
  Received: 2,
  Attached: 3,
  Cancelled: 4,
} as const
export type LabWorkStatus = (typeof LabWorkStatus)[keyof typeof LabWorkStatus]

export type LabWorkStatusName =
  | "Sent"
  | "InProgress"
  | "Received"
  | "Attached"
  | "Cancelled"

export const LAB_WORK_STATUS_LABELS_VI: Record<LabWorkStatus, string> = {
  [LabWorkStatus.Sent]: "Đã gửi",
  [LabWorkStatus.InProgress]: "Đang làm",
  [LabWorkStatus.Received]: "Đã nhận",
  [LabWorkStatus.Attached]: "Đã gắn cho bệnh nhân",
  [LabWorkStatus.Cancelled]: "Đã huỷ",
}

export const LAB_WORK_BOARD_COLUMNS: LabWorkStatusName[] = [
  "Sent",
  "InProgress",
  "Received",
  "Attached",
]

export interface LabWorkDto {
  id: string
  patientId: string
  patientFullName: string
  appointmentId?: string | null
  appointmentScheduledDateTime?: string | null
  labName: string
  workType: string
  toothNumberList: number[]
  sentDate: string
  expectedReceiveDate?: string | null
  receivedDate?: string | null
  cost: number
  status: LabWorkStatus
  notes?: string | null
}

export interface CreateUpdateLabWorkDto {
  patientId: string
  appointmentId?: string | null
  labName: string
  workType: string
  toothNumberList: number[]
  sentDate: string
  expectedReceiveDate?: string | null
  cost: number
  status: LabWorkStatusName
  notes?: string | null
}

export interface UpdateLabWorkStatusDto {
  status: LabWorkStatusName
}

export interface GetLabWorkListRequest extends PagedAndSortedRequest {
  patientId?: string
  status?: LabWorkStatusName
}
