import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TaskItemDto } from "@/types/task"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} ₫`
}

export function isTaskOverdue(task: Pick<TaskItemDto, "dueDate" | "isDone">): boolean {
  if (!task.dueDate || task.isDone) return false
  return new Date(task.dueDate) < new Date(new Date().toDateString())
}
