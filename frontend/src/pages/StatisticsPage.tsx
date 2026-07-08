import { useEffect, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { statisticsApi } from "@/lib/statistics-api"
import { ApiError } from "@/lib/api"
import { formatCurrency, cn } from "@/lib/utils"
import type {
  DoctorStatisticDto,
  RevenueOverviewDto,
  ServiceStatisticDto,
} from "@/types/statistics"

type RangeOption = "7d" | "30d" | "thisMonth"

const RANGE_LABELS: Record<RangeOption, string> = {
  "7d": "7 ngày qua",
  "30d": "30 ngày qua",
  thisMonth: "Tháng này",
}

function toDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getRange(option: RangeOption): { fromDate: string; toDate: string } {
  const now = new Date()
  const toDate = toDateOnly(now)

  if (option === "7d") {
    const from = new Date(now)
    from.setDate(from.getDate() - 6)
    return { fromDate: toDateOnly(from), toDate }
  }
  if (option === "30d") {
    const from = new Date(now)
    from.setDate(from.getDate() - 29)
    return { fromDate: toDateOnly(from), toDate }
  }
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return { fromDate: toDateOnly(firstOfMonth), toDate }
}

export function StatisticsPage() {
  const [range, setRange] = useState<RangeOption>("30d")
  const [revenue, setRevenue] = useState<RevenueOverviewDto | null>(null)
  const [serviceStats, setServiceStats] = useState<ServiceStatisticDto[]>([])
  const [doctorStats, setDoctorStats] = useState<DoctorStatisticDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { fromDate, toDate } = getRange(range)
    setIsLoading(true)
    void (async () => {
      try {
        const [revenueResult, serviceResult, doctorResult] = await Promise.all([
          statisticsApi.getRevenueOverview(fromDate, toDate),
          statisticsApi.getServiceStatistics(fromDate, toDate),
          statisticsApi.getDoctorStatistics(fromDate, toDate),
        ])
        setRevenue(revenueResult)
        setServiceStats(serviceResult)
        setDoctorStats(doctorResult)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Không tải được số liệu thống kê")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [range])

  const chartData = (revenue?.points ?? []).map((p) => ({
    date: new Date(p.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
    amount: p.amount,
  }))

  const isGrowthPositive = (revenue?.growthPercentage ?? 0) >= 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Thống kê</h1>
          <p className="text-sm text-muted-foreground">
            Doanh thu, loại hình khám và hiệu suất theo bác sĩ
          </p>
        </div>
        <Select value={range} onValueChange={(value: RangeOption) => setRange(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGE_LABELS) as RangeOption[]).map((key) => (
              <SelectItem key={key} value={key}>
                {RANGE_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Doanh thu {RANGE_LABELS[range].toLowerCase()}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-40" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(revenue?.currentPeriodTotal ?? 0)}</p>
            )}
          </div>
          {!isLoading && (
            <Badge
              variant={isGrowthPositive ? "success" : "destructive"}
              className="flex items-center gap-1 text-sm"
            >
              {isGrowthPositive ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {Math.abs(revenue?.growthPercentage ?? 0)}% so với kỳ trước
            </Badge>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis
                  fontSize={12}
                  tickFormatter={(v: number) => v.toLocaleString("vi-VN")}
                  width={80}
                />
                <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-primary, #2563eb)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Dịch vụ phổ biến</h2>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : serviceStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu trong khoảng thời gian này.</p>
          ) : (
            <>
              <div className="mb-4 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceStats.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" fontSize={12} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="serviceName"
                      width={110}
                      fontSize={12}
                    />
                    <RechartsTooltip formatter={(value) => [value, "Số ca"]} />
                    <Bar dataKey="appointmentCount" fill="var(--color-primary, #2563eb)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dịch vụ</TableHead>
                    <TableHead className="text-right">Số ca</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceStats.map((stat) => (
                    <TableRow key={stat.serviceId ?? "unassigned"}>
                      <TableCell>{stat.serviceName}</TableCell>
                      <TableCell className="text-right">{stat.appointmentCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stat.totalRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Theo bác sĩ</h2>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : doctorStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu trong khoảng thời gian này.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead className="text-right">Số ca</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorStats.map((stat) => (
                  <TableRow key={stat.doctorId ?? "unassigned"}>
                    <TableCell className={cn(!stat.doctorId && "text-muted-foreground italic")}>
                      {stat.doctorName}
                    </TableCell>
                    <TableCell className="text-right">{stat.appointmentCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(stat.totalRevenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
