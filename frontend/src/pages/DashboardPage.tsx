import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
  Receipt,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { appointmentsApi } from "@/lib/appointments-api"
import { patientsApi } from "@/lib/patients-api"
import { labWorksApi } from "@/lib/lab-works-api"
import { expensesApi } from "@/lib/expenses-api"
import { tasksApi } from "@/lib/tasks-api"
import { formatCurrency } from "@/lib/utils"
import { APPOINTMENT_STATUS_LABELS_VI } from "@/types/appointment"
import type { AppointmentDto } from "@/types/appointment"
import { LAB_WORK_STATUS_LABELS_VI, LabWorkStatus } from "@/types/labWork"
import type { LabWorkDto } from "@/types/labWork"
import { TASK_PRIORITY_LABELS_VI } from "@/types/task"
import type { TaskItemDto } from "@/types/task"

interface DashboardData {
  totalPatients: number | null
  todayAppointments: AppointmentDto[] | null
  activeLabWorks: LabWorkDto[] | null
  monthExpenseTotal: number | null
  upcomingTasks: TaskItemDto[] | null
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function settledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const [patients, todayAppointments, labWorkBoard, expenseSummary, upcomingTasks] =
        await Promise.allSettled([
          patientsApi.getList({ maxResultCount: 1 }),
          appointmentsApi.getCalendarView(
            startOfDay(now).toISOString(),
            endOfDay(now).toISOString(),
          ),
          labWorksApi.getBoard(),
          expensesApi.getSummary(monthStart.toISOString(), monthEnd.toISOString()),
          tasksApi.getOverview(),
        ])

      const failedCount = [patients, todayAppointments, labWorkBoard, expenseSummary, upcomingTasks]
        .filter((r) => r.status === "rejected").length
      if (failedCount > 0) {
        toast.error(
          failedCount === 5
            ? "Không tải được tổng quan"
            : `Không tải được ${failedCount} phần của trang tổng quan`,
        )
      }

      const appointmentsResult = settledValue(todayAppointments)

      setData({
        totalPatients: settledValue(patients)?.totalCount ?? null,
        todayAppointments:
          appointmentsResult?.slice().sort((a, b) => a.scheduledDateTime.localeCompare(b.scheduledDateTime)) ?? null,
        activeLabWorks:
          settledValue(labWorkBoard)?.filter((x) => x.status !== LabWorkStatus.Attached) ?? null,
        monthExpenseTotal: settledValue(expenseSummary)?.totalAmount ?? null,
        upcomingTasks: settledValue(upcomingTasks),
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <AlertCircle className="size-8" />
        <p>Không tải được tổng quan.</p>
        <Button variant="outline" size="sm" onClick={() => void loadData()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Trang chủ</h1>
        <p className="text-sm text-muted-foreground">Tổng quan phòng khám hôm nay</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/patients">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Bệnh nhân</p>
                <p className="text-2xl font-semibold">
                  {data.totalPatients ?? <span className="text-base text-muted-foreground">—</span>}
                </p>
              </div>
              <Users className="size-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/appointments">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Lịch hẹn hôm nay</p>
                <p className="text-2xl font-semibold">
                  {data.todayAppointments?.length ?? <span className="text-base text-muted-foreground">—</span>}
                </p>
              </div>
              <CalendarDays className="size-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/lab-works">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Ca labo đang xử lý</p>
                <p className="text-2xl font-semibold">
                  {data.activeLabWorks?.length ?? <span className="text-base text-muted-foreground">—</span>}
                </p>
              </div>
              <FlaskConical className="size-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/expenses">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Chi phí tháng này</p>
                <p className="text-2xl font-semibold">
                  {data.monthExpenseTotal !== null ? (
                    formatCurrency(data.monthExpenseTotal)
                  ) : (
                    <span className="text-base text-muted-foreground">—</span>
                  )}
                </p>
              </div>
              <Receipt className="size-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lịch hẹn hôm nay</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.todayAppointments === null && (
              <p className="text-sm text-muted-foreground">Không tải được lịch hẹn hôm nay.</p>
            )}
            {data.todayAppointments?.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có lịch hẹn nào hôm nay.</p>
            )}
            {data.todayAppointments?.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                <div>
                  <p className="font-medium">{a.patientFullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.scheduledDateTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant="outline">{APPOINTMENT_STATUS_LABELS_VI[a.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Công việc sắp tới</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.upcomingTasks === null && (
              <p className="text-sm text-muted-foreground">Không tải được công việc.</p>
            )}
            {data.upcomingTasks?.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có công việc nào đang chờ.</p>
            )}
            {data.upcomingTasks?.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                  <span>{t.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {t.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.dueDate).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                  <Badge variant="outline">{TASK_PRIORITY_LABELS_VI[t.priority]}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {data.activeLabWorks === null && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Không tải được danh sách ca labo.
          </CardContent>
        </Card>
      )}

      {data.activeLabWorks !== null && data.activeLabWorks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ca labo đang xử lý</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.activeLabWorks.map((lw) => (
              <div key={lw.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                <div>
                  <p className="font-medium">{lw.patientFullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {lw.labName} — {lw.workType}
                  </p>
                </div>
                <Badge variant="outline">{LAB_WORK_STATUS_LABELS_VI[lw.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
