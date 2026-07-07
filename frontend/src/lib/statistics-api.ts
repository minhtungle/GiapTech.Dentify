import { api } from "./api"
import type {
  DoctorStatisticDto,
  RevenueOverviewDto,
  TreatmentTypeStatisticDto,
} from "@/types/statistics"

const BASE = "/api/app/statistics"

export const statisticsApi = {
  getRevenueOverview: (fromDate: string, toDate: string) =>
    api.get<RevenueOverviewDto>(`${BASE}/revenue-overview`, { fromDate, toDate }),
  getTreatmentTypeStatistics: (fromDate: string, toDate: string) =>
    api.get<TreatmentTypeStatisticDto[]>(`${BASE}/treatment-type-statistics`, {
      fromDate,
      toDate,
    }),
  getDoctorStatistics: (fromDate: string, toDate: string) =>
    api.get<DoctorStatisticDto[]>(`${BASE}/doctor-statistics`, { fromDate, toDate }),
}
