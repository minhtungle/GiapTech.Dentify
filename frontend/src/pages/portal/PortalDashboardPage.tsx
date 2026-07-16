import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, CalendarDays, CheckCircle2, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { patientPortalApi, ApiError } from "@/lib/patient-portal-api"
import { formatCurrency } from "@/lib/utils"
import { APPOINTMENT_STATUS_LABELS_VI } from "@/types/patientPortal"
import type {
  PatientPortalProfileDto,
  PatientPortalAppointmentDto,
  PatientPortalBalanceDto,
} from "@/types/patientPortal"

const UPCOMING_PREVIEW_COUNT = 3

interface DashboardData {
  profile: PatientPortalProfileDto
  balance: PatientPortalBalanceDto
  upcomingAppointments: PatientPortalAppointmentDto[]
}

export function PortalDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [profile, balance, upcomingAppointments] = await Promise.all([
        patientPortalApi.getMyProfile(),
        patientPortalApi.getMyBalance(),
        patientPortalApi.getMyAppointments(true),
      ])
      setData({ profile, balance, upcomingAppointments })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được thông tin tổng quan.")
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
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <AlertCircle className="size-8" />
        <p>{error ?? "Không tải được thông tin tổng quan."}</p>
        <Button variant="outline" size="sm" onClick={() => void loadData()}>
          Thử lại
        </Button>
      </div>
    )
  }

  const { profile, balance, upcomingAppointments } = data
  const isSettled = balance.totalDebt <= 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Xin chào, {profile.fullName}</h1>
        <p className="text-sm text-muted-foreground">Tổng quan hồ sơ của bạn</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Họ và tên</span>
              <span className="font-medium">{profile.fullName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Ngày sinh</span>
              <span className="font-medium">
                {new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 last:border-0">
              <span className="text-muted-foreground">Số điện thoại</span>
              <span className="font-medium">{profile.phoneNumber ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profile.email ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Công nợ</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-3">
              <Wallet className="size-8 text-muted-foreground" />
              <p className="text-2xl font-semibold">{formatCurrency(Math.max(balance.totalDebt, 0))}</p>
            </div>
            {isSettled ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                Đã thanh toán đủ
              </Badge>
            ) : (
              <Badge variant="destructive">Còn nợ</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Lịch hẹn sắp tới</CardTitle>
          <Link to="/portal/appointments" className="text-sm text-primary hover:underline">
            Xem tất cả
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {upcomingAppointments.length === 0 && (
            <p className="text-sm text-muted-foreground">Bạn không có lịch hẹn sắp tới nào.</p>
          )}
          {upcomingAppointments.slice(0, UPCOMING_PREVIEW_COUNT).map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {new Date(a.scheduledDateTime).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.doctorName ?? "Chưa phân công"} · {a.serviceName ?? "Chưa phân loại"}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{APPOINTMENT_STATUS_LABELS_VI[a.status]}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
