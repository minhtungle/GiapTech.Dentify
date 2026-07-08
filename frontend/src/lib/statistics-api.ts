import { api } from "./api"
import type {
  DoctorStatisticDto,
  RevenueOverviewDto,
  ServiceStatisticDto,
} from "@/types/statistics"

const BASE = "/api/app/statistics"

export const statisticsApi = {
  getRevenueOverview: (fromDate: string, toDate: string) =>
    api.get<RevenueOverviewDto>(`${BASE}/revenue-overview`, { fromDate, toDate }),
  getServiceStatistics: (fromDate: string, toDate: string) =>
    api.get<ServiceStatisticDto[]>(`${BASE}/service-statistics`, {
      fromDate,
      toDate,
    }),
  getDoctorStatistics: (fromDate: string, toDate: string) =>
    api.get<DoctorStatisticDto[]>(`${BASE}/doctor-statistics`, { fromDate, toDate }),
}
