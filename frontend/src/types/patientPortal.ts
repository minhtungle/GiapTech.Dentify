export const AppointmentStatus = {
  Scheduled: 0,
  InProgress: 1,
  Completed: 2,
  Cancelled: 3,
  NoShow: 4,
} as const
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

export const APPOINTMENT_STATUS_LABELS_VI: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Scheduled]: "Đã lên lịch",
  [AppointmentStatus.InProgress]: "Đang thực hiện",
  [AppointmentStatus.Completed]: "Hoàn thành",
  [AppointmentStatus.Cancelled]: "Đã huỷ",
  [AppointmentStatus.NoShow]: "Không đến",
}

export interface PatientPortalProfileDto {
  patientId: string
  fullName: string
  dateOfBirth: string
  phoneNumber?: string | null
  email?: string | null
}

export interface PatientPortalAppointmentDto {
  id: string
  scheduledDateTime: string
  durationMinutes: number
  status: AppointmentStatus
  doctorName?: string | null
  serviceName?: string | null
}

export interface PatientPortalBalanceDto {
  totalDebt: number
}
