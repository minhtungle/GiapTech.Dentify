import { api } from "./api"
import type { PagedResultDto } from "@/types/common"
import type {
  AppointmentDto,
  CreateUpdateAppointmentDto,
  CreatePaymentDto,
  GetAppointmentListRequest,
} from "@/types/appointment"

const BASE = "/api/app/appointment"

export const appointmentsApi = {
  getList: (params: GetAppointmentListRequest) =>
    api.get<PagedResultDto<AppointmentDto>>(BASE, params),
  get: (id: string) => api.get<AppointmentDto>(`${BASE}/${id}`),
  getCalendarView: (fromDate: string, toDate: string) =>
    api.get<AppointmentDto[]>(`${BASE}/calendar-view`, { fromDate, toDate }),
  create: (input: CreateUpdateAppointmentDto) =>
    api.post<AppointmentDto>(BASE, input),
  update: (id: string, input: CreateUpdateAppointmentDto) =>
    api.put<AppointmentDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
  addPayment: (id: string, input: CreatePaymentDto) =>
    api.post<AppointmentDto>(`${BASE}/${id}/payment`, input),
  removePayment: (id: string, paymentId: string) =>
    api.delete<AppointmentDto>(`${BASE}/${id}/payment`, { paymentId }),
}
