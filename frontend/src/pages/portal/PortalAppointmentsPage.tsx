import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { patientPortalApi, ApiError } from "@/lib/patient-portal-api"
import { APPOINTMENT_STATUS_LABELS_VI } from "@/types/patientPortal"
import type { PatientPortalAppointmentDto } from "@/types/patientPortal"

interface AppointmentsData {
  upcoming: PatientPortalAppointmentDto[]
  history: PatientPortalAppointmentDto[]
}

function AppointmentTable({ appointments }: { appointments: PatientPortalAppointmentDto[] }) {
  if (appointments.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Không có lịch hẹn nào.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ngày giờ</TableHead>
          <TableHead>Bác sĩ</TableHead>
          <TableHead>Dịch vụ</TableHead>
          <TableHead>Trạng thái</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              {new Date(a.scheduledDateTime).toLocaleString("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </TableCell>
            <TableCell>{a.doctorName ?? "Chưa phân công"}</TableCell>
            <TableCell>{a.serviceName ?? "Chưa phân loại"}</TableCell>
            <TableCell>
              <Badge variant="outline">{APPOINTMENT_STATUS_LABELS_VI[a.status]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function PortalAppointmentsPage() {
  const [data, setData] = useState<AppointmentsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [upcoming, history] = await Promise.all([
        patientPortalApi.getMyAppointments(true),
        patientPortalApi.getMyTreatmentHistory(),
      ])
      setData({ upcoming, history })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách lịch hẹn.")
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
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <AlertCircle className="size-8" />
        <p>{error ?? "Không tải được danh sách lịch hẹn."}</p>
        <Button variant="outline" size="sm" onClick={() => void loadData()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Lịch hẹn</h1>
        <p className="text-sm text-muted-foreground">Danh sách lịch hẹn của bạn</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Sắp tới</TabsTrigger>
          <TabsTrigger value="history">Lịch sử điều trị</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <AppointmentTable appointments={data.upcoming} />
        </TabsContent>
        <TabsContent value="history">
          <AppointmentTable appointments={data.history} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
