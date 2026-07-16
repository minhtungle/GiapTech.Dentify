import type { PagedAndSortedRequest } from "./common"

export const TreatmentPlanStatus = {
  Draft: 0,
  Active: 1,
  Completed: 2,
  Cancelled: 3,
} as const
export type TreatmentPlanStatus = (typeof TreatmentPlanStatus)[keyof typeof TreatmentPlanStatus]

export type TreatmentPlanStatusName = "Draft" | "Active" | "Completed" | "Cancelled"

export const TREATMENT_PLAN_STATUS_LABELS_VI: Record<TreatmentPlanStatus, string> = {
  [TreatmentPlanStatus.Draft]: "Nháp",
  [TreatmentPlanStatus.Active]: "Đang thực hiện",
  [TreatmentPlanStatus.Completed]: "Hoàn thành",
  [TreatmentPlanStatus.Cancelled]: "Đã huỷ",
}

export const TreatmentPlanItemStatus = {
  Pending: 0,
  InProgress: 1,
  Completed: 2,
  Skipped: 3,
} as const
export type TreatmentPlanItemStatus =
  (typeof TreatmentPlanItemStatus)[keyof typeof TreatmentPlanItemStatus]

export type TreatmentPlanItemStatusName = "Pending" | "InProgress" | "Completed" | "Skipped"

export const TREATMENT_PLAN_ITEM_STATUS_LABELS_VI: Record<TreatmentPlanItemStatus, string> = {
  [TreatmentPlanItemStatus.Pending]: "Chờ thực hiện",
  [TreatmentPlanItemStatus.InProgress]: "Đang thực hiện",
  [TreatmentPlanItemStatus.Completed]: "Hoàn thành",
  [TreatmentPlanItemStatus.Skipped]: "Bỏ qua",
}

export interface TreatmentPlanItemDto {
  id: string
  treatmentPlanId: string
  serviceId?: string | null
  serviceName?: string | null
  stepOrder: number
  description: string
  estimatedCost: number
  status: TreatmentPlanItemStatus
  appointmentId?: string | null
}

export interface CreateUpdateTreatmentPlanItemDto {
  id?: string | null
  serviceId?: string | null
  stepOrder: number
  description: string
  estimatedCost: number
}

export interface TreatmentPlanDto {
  id: string
  patientId: string
  patientFullName: string
  title: string
  notes?: string | null
  status: TreatmentPlanStatus
  items: TreatmentPlanItemDto[]
  creationTime: string
  lastModificationTime?: string | null
}

export interface CreateUpdateTreatmentPlanDto {
  patientId: string
  title: string
  notes?: string | null
  items: CreateUpdateTreatmentPlanItemDto[]
}

export interface GetTreatmentPlanListRequest extends PagedAndSortedRequest {
  patientId?: string
  status?: TreatmentPlanStatusName
}

export interface ChangeTreatmentPlanStatusDto {
  status: TreatmentPlanStatusName
}

export interface ChangeTreatmentPlanItemStatusDto {
  status: TreatmentPlanItemStatusName
}

export interface LinkTreatmentPlanItemToAppointmentDto {
  appointmentId?: string | null
}
