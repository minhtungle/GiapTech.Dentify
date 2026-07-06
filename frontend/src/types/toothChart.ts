export const ToothStatus = {
  Healthy: 0,
  Decayed: 1,
  Filled: 2,
  Missing: 3,
  Crown: 4,
  RootCanal: 5,
  Extracted: 6,
  Implant: 7,
} as const
export type ToothStatus = (typeof ToothStatus)[keyof typeof ToothStatus]

export type ToothStatusName =
  | "Healthy"
  | "Decayed"
  | "Filled"
  | "Missing"
  | "Crown"
  | "RootCanal"
  | "Extracted"
  | "Implant"

export const TOOTH_STATUS_NAMES: ToothStatusName[] = [
  "Healthy",
  "Decayed",
  "Filled",
  "Missing",
  "Crown",
  "RootCanal",
  "Extracted",
  "Implant",
]

export const TOOTH_STATUS_LABELS_VI: Record<ToothStatus, string> = {
  [ToothStatus.Healthy]: "Khoẻ mạnh",
  [ToothStatus.Decayed]: "Sâu răng",
  [ToothStatus.Filled]: "Đã trám",
  [ToothStatus.Missing]: "Mất răng",
  [ToothStatus.Crown]: "Bọc răng sứ",
  [ToothStatus.RootCanal]: "Điều trị tuỷ",
  [ToothStatus.Extracted]: "Đã nhổ",
  [ToothStatus.Implant]: "Cấy ghép Implant",
}

// Colors used both for the SVG fill and the legend.
export const TOOTH_STATUS_COLORS: Record<ToothStatus, string> = {
  [ToothStatus.Healthy]: "#ffffff",
  [ToothStatus.Decayed]: "#dc2626",
  [ToothStatus.Filled]: "#3b82f6",
  [ToothStatus.Missing]: "#9ca3af",
  [ToothStatus.Crown]: "#eab308",
  [ToothStatus.RootCanal]: "#a855f7",
  [ToothStatus.Extracted]: "#4b5563",
  [ToothStatus.Implant]: "#14b8a6",
}

export interface ToothRecordDto {
  toothNumber: number
  status: ToothStatus
  notes?: string | null
  lastUpdated: string
  updatedByAppointmentId?: string | null
}

export interface ToothChartDto {
  patientId: string
  isChildPatient: boolean
  records: ToothRecordDto[]
}

export interface UpdateToothStatusDto {
  status: ToothStatusName
  notes?: string | null
  appointmentId?: string | null
}

export interface ToothRecordHistoryDto {
  toothNumber: number
  status: ToothStatus
  notes?: string | null
  appointmentId?: string | null
  recordedAt: string
}
