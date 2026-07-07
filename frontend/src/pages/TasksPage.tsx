import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { tasksApi } from "@/lib/tasks-api"
import { ApiError } from "@/lib/api"
import { cn, isTaskOverdue } from "@/lib/utils"
import type { CreateUpdateTaskItemDto, TaskItemDto, TaskPriorityName } from "@/types/task"
import { TASK_PRIORITY_LABELS_VI, TASK_PRIORITY_NAMES, TaskPriority } from "@/types/task"

function emptyForm(): CreateUpdateTaskItemDto {
  return { title: "", content: "", priority: "Medium", dueDate: "" }
}

const PRIORITY_BADGE_VARIANT: Record<TaskPriority, "outline" | "warning" | "destructive"> = {
  [TaskPriority.Low]: "outline",
  [TaskPriority.Medium]: "warning",
  [TaskPriority.High]: "destructive",
}

export function TasksPage() {
  const [tasks, setTasks] = useState<TaskItemDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateTaskItemDto>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  const [deletingTask, setDeletingTask] = useState<TaskItemDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityName | "">("")
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await tasksApi.getList({
        maxResultCount: 200,
        priority: priorityFilter || undefined,
      })
      setTasks(result.items)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được danh sách công việc")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreateDialog = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEditDialog = (task: TaskItemDto) => {
    setEditingId(task.id)
    setForm({
      title: task.title,
      content: task.content ?? "",
      priority: (Object.keys(TaskPriority) as TaskPriorityName[]).find(
        (key) => TaskPriority[key] === task.priority,
      ) ?? "Medium",
      dueDate: task.dueDate?.slice(0, 10) ?? "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const dto: CreateUpdateTaskItemDto = {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      }
      if (editingId) {
        await tasksApi.update(editingId, dto)
        toast.success("Đã cập nhật công việc")
      } else {
        await tasksApi.create(dto)
        toast.success("Đã thêm công việc mới")
      }
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Lưu thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleDone = async (task: TaskItemDto) => {
    setTogglingId(task.id)
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isDone: !t.isDone } : t)))
    try {
      await tasksApi.toggleDone(task.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật thất bại")
      await loadData()
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingTask) return
    setIsDeleting(true)
    try {
      await tasksApi.delete(deletingTask.id)
      toast.success("Đã xoá công việc")
      setDeletingTask(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xoá thất bại")
    } finally {
      setIsDeleting(false)
    }
  }

  const pendingTasks = tasks.filter(
    (t) => !t.isDone && (!showOverdueOnly || isTaskOverdue(t)),
  )
  const doneTasks = tasks.filter((t) => t.isDone)

  const renderTaskRow = (task: TaskItemDto) => (
    <div
      key={task.id}
      className="group flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent/50"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.isDone}
        aria-label={task.isDone ? `Đánh dấu "${task.title}" chưa hoàn thành` : `Đánh dấu "${task.title}" đã hoàn thành`}
        onClick={() => void handleToggleDone(task)}
        disabled={togglingId === task.id}
        className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        {task.isDone ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : (
          <Circle className="size-5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-sm", task.isDone && "text-muted-foreground line-through")}>
            {task.title}
          </span>
          <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} className="text-[10px]">
            {TASK_PRIORITY_LABELS_VI[task.priority]}
          </Badge>
          {task.dueDate && (
            <span className={cn("text-xs text-muted-foreground", isTaskOverdue(task) && "text-destructive")}>
              {new Date(task.dueDate).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>
        {task.content && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.content}</p>
        )}
      </div>

      <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          title="Sửa"
          aria-label={`Sửa công việc ${task.title}`}
          onClick={() => openEditDialog(task)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          title="Xoá"
          aria-label={`Xoá công việc ${task.title}`}
          onClick={() => setDeletingTask(task)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Công việc</h1>
          <p className="text-sm text-muted-foreground">
            {pendingTasks.length} việc cần làm · {doneTasks.length} đã hoàn thành
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Thêm công việc
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={priorityFilter || "all"}
          onValueChange={(value: string) => {
            setPriorityFilter(value === "all" ? "" : (value as TaskPriorityName))
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Độ ưu tiên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi độ ưu tiên</SelectItem>
            {TASK_PRIORITY_NAMES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {TASK_PRIORITY_LABELS_VI[TaskPriority[priority]]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => void loadData()}>
          Lọc
        </Button>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showOverdueOnly}
            onChange={(e) => setShowOverdueOnly(e.target.checked)}
            className="size-4"
          />
          Chỉ hiện việc quá hạn
        </label>
      </div>

      <div className="rounded-lg border bg-card p-2">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-full max-w-64" />
            </div>
          ))}

        {!isLoading && tasks.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <CheckCircle2 className="size-8" />
            <p>Chưa có công việc nào.</p>
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Thêm công việc đầu tiên
            </Button>
          </div>
        )}

        {!isLoading && pendingTasks.length > 0 && (
          <div className="flex flex-col divide-y">{pendingTasks.map(renderTaskRow)}</div>
        )}

        {!isLoading && doneTasks.length > 0 && (
          <div className="mt-2 flex flex-col divide-y border-t pt-2">
            {doneTasks.map(renderTaskRow)}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa công việc" : "Thêm công việc"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Độ ưu tiên</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value: TaskPriorityName) => setForm({ ...form, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITY_NAMES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {TASK_PRIORITY_LABELS_VI[TaskPriority[priority]]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Hạn chót</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate ?? ""}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Nội dung</Label>
              <Textarea
                id="content"
                value={form.content ?? ""}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingTask !== null}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Xoá công việc"
        description={`Bạn có chắc muốn xoá công việc "${deletingTask?.title}"? Hành động này không thể hoàn tác.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
