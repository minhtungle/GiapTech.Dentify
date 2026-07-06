import type { PagedAndSortedRequest } from "./common"

export const TaskPriority = {
  Low: 0,
  Medium: 1,
  High: 2,
} as const
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority]

export type TaskPriorityName = "Low" | "Medium" | "High"

export const TASK_PRIORITY_LABELS_VI: Record<TaskPriority, string> = {
  [TaskPriority.Low]: "Thấp",
  [TaskPriority.Medium]: "Trung bình",
  [TaskPriority.High]: "Cao",
}

export const TASK_PRIORITY_NAMES: TaskPriorityName[] = ["Low", "Medium", "High"]

export interface TaskItemDto {
  id: string
  title: string
  content?: string | null
  isDone: boolean
  priority: TaskPriority
  dueDate?: string | null
  creationTime: string
}

export interface CreateUpdateTaskItemDto {
  title: string
  content?: string | null
  priority: TaskPriorityName
  dueDate?: string | null
}

export interface GetTaskItemListRequest extends PagedAndSortedRequest {
  isDone?: boolean
  priority?: TaskPriorityName
}
