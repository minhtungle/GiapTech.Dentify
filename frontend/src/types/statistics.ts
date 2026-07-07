import type { TreatmentType } from "./appointment"

export interface RevenuePointDto {
  date: string
  amount: number
}

export interface RevenueOverviewDto {
  currentPeriodTotal: number
  previousPeriodTotal: number
  growthPercentage: number
  points: RevenuePointDto[]
}

export interface TreatmentTypeStatisticDto {
  treatmentType: TreatmentType
  appointmentCount: number
  totalRevenue: number
}

export interface DoctorStatisticDto {
  doctorId?: string | null
  doctorName: string
  appointmentCount: number
  totalRevenue: number
}
