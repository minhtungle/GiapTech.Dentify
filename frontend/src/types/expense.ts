import type { PagedAndSortedRequest } from "./common"

export const ExpenseCategory = {
  Lab: 0,
  Supplies: 1,
  Salary: 2,
  Rent: 3,
  Utilities: 4,
  Marketing: 5,
  Other: 6,
} as const
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory]

export type ExpenseCategoryName =
  | "Lab"
  | "Supplies"
  | "Salary"
  | "Rent"
  | "Utilities"
  | "Marketing"
  | "Other"

export const EXPENSE_CATEGORY_LABELS_VI: Record<ExpenseCategory, string> = {
  [ExpenseCategory.Lab]: "Labo",
  [ExpenseCategory.Supplies]: "Vật tư",
  [ExpenseCategory.Salary]: "Lương",
  [ExpenseCategory.Rent]: "Thuê mặt bằng",
  [ExpenseCategory.Utilities]: "Điện nước",
  [ExpenseCategory.Marketing]: "Marketing",
  [ExpenseCategory.Other]: "Khác",
}

export const EXPENSE_CATEGORY_NAMES: ExpenseCategoryName[] = [
  "Lab",
  "Supplies",
  "Salary",
  "Rent",
  "Utilities",
  "Marketing",
  "Other",
]

export interface ExpenseDto {
  id: string
  expenseDate: string
  amount: number
  category: ExpenseCategory
  description?: string | null
  labWorkId?: string | null
}

export interface CreateUpdateExpenseDto {
  expenseDate: string
  amount: number
  category: ExpenseCategoryName
  description?: string | null
  labWorkId?: string | null
}

export interface GetExpenseListRequest extends PagedAndSortedRequest {
  category?: ExpenseCategoryName
  fromDate?: string
  toDate?: string
  labWorkId?: string
}

export interface ExpenseCategorySummaryDto {
  category: ExpenseCategory
  totalAmount: number
}

export interface ExpenseSummaryDto {
  totalAmount: number
  byCategory: ExpenseCategorySummaryDto[]
}
