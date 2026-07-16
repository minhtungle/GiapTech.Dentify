import { api } from "./api"
import type {
  ToothChartDto,
  ToothRecordDto,
  ToothRecordHistoryDto,
  UpdateToothStatusDto,
} from "@/types/toothChart"

const BASE = "/api/app/tooth-chart"

export const toothChartApi = {
  get: (patientId: string) => api.get<ToothChartDto>(`${BASE}/${patientId}`),
  updateStatus: (patientId: string, toothNumber: number, input: UpdateToothStatusDto) =>
    api.put<ToothRecordDto>(`${BASE}/status/${patientId}?toothNumber=${toothNumber}`, input),
  getHistory: (patientId: string, toothNumber: number) =>
    api.get<ToothRecordHistoryDto[]>(`${BASE}/history/${patientId}`, { toothNumber }),
}
