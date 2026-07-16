import type { PagedAndSortedRequest } from "./common"

export const WaitlistStatus = {
  Waiting: 0,
  Scheduled: 1,
  Cancelled: 2,
} as const
export type WaitlistStatus = (typeof WaitlistStatus)[keyof typeof WaitlistStatus]

export type WaitlistStatusName = "Waiting" | "Scheduled" | "Cancelled"

export const WAITLIST_STATUS_LABELS_VI: Record<WaitlistStatus, string> = {
  [WaitlistStatus.Waiting]: "Đang chờ",
  [WaitlistStatus.Scheduled]: "Đã xếp lịch",
  [WaitlistStatus.Cancelled]: "Đã huỷ",
}

export interface WaitlistEntryDto {
  id: string
  patientId: string
  patientFullName: string
  doctorId?: string | null
  doctorName?: string | null
  serviceId?: string | null
  serviceName?: string | null
  preferredTimeNote?: string | null
  notes?: string | null
  status: WaitlistStatus
  creationTime: string
}

export interface CreateUpdateWaitlistEntryDto {
  patientId: string
  doctorId?: string | null
  serviceId?: string | null
  preferredTimeNote?: string | null
  notes?: string | null
}

export interface ChangeWaitlistEntryStatusDto {
  status: WaitlistStatusName
}

export interface GetWaitlistEntryListRequest extends PagedAndSortedRequest {
  status?: WaitlistStatusName
}
