import { api } from "./api"
import type { PagedResultDto } from "@/types/common"
import type {
  CreateUpdateExpenseDto,
  ExpenseDto,
  ExpenseSummaryDto,
  GetExpenseListRequest,
} from "@/types/expense"

const BASE = "/api/app/expense"

export const expensesApi = {
  getList: (params: GetExpenseListRequest) =>
    api.get<PagedResultDto<ExpenseDto>>(BASE, params),
  get: (id: string) => api.get<ExpenseDto>(`${BASE}/${id}`),
  getSummary: (fromDate: string, toDate: string) =>
    api.get<ExpenseSummaryDto>(`${BASE}/summary`, { fromDate, toDate }),
  create: (input: CreateUpdateExpenseDto) => api.post<ExpenseDto>(BASE, input),
  update: (id: string, input: CreateUpdateExpenseDto) =>
    api.put<ExpenseDto>(`${BASE}/${id}`, input),
  delete: (id: string) => api.delete<void>(`${BASE}/${id}`),
}
