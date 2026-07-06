import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AlertCircle, ArrowLeft, History } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { ToothChartSvg } from "@/components/tooth-chart/ToothChartSvg"
import { toothChartApi } from "@/lib/tooth-chart-api"
import { patientsApi } from "@/lib/patients-api"
import { ApiError } from "@/lib/api"
import type {
  ToothChartDto,
  ToothRecordHistoryDto,
  ToothStatusName,
} from "@/types/toothChart"
import {
  TOOTH_STATUS_COLORS,
  TOOTH_STATUS_LABELS_VI,
  TOOTH_STATUS_NAMES,
  ToothStatus,
} from "@/types/toothChart"
import type { PatientDto } from "@/types/patient"

export function ToothChartPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<PatientDto | null>(null)
  const [chart, setChart] = useState<ToothChartDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [statusValue, setStatusValue] = useState<ToothStatusName>("Healthy")
  const [notesValue, setNotesValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [history, setHistory] = useState<ToothRecordHistoryDto[] | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const loadData = async () => {
    if (!patientId) return
    setIsLoading(true)
    setLoadError(false)
    try {
      const [patientResult, chartResult] = await Promise.all([
        patientsApi.get(patientId),
        toothChartApi.get(patientId),
      ])
      setPatient(patientResult)
      setChart(chartResult)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được sơ đồ răng")
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const openToothDialog = (toothNumber: number) => {
    const record = chart?.records.find((r) => r.toothNumber === toothNumber)
    const statusName =
      TOOTH_STATUS_NAMES[record?.status ?? ToothStatus.Healthy] ?? "Healthy"
    setSelectedTooth(toothNumber)
    setStatusValue(statusName)
    setNotesValue(record?.notes ?? "")
    setHistory(null)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!patientId || selectedTooth === null) return
    setIsSaving(true)
    try {
      await toothChartApi.updateStatus(patientId, selectedTooth, {
        status: statusValue,
        notes: notesValue.trim() || undefined,
      })
      toast.success(`Đã cập nhật răng ${selectedTooth}`)
      setSelectedTooth(null)
      await loadData()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cập nhật thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const loadHistory = async () => {
    if (!patientId || selectedTooth === null) return
    setIsLoadingHistory(true)
    try {
      const result = await toothChartApi.getHistory(patientId, selectedTooth)
      setHistory(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không tải được lịch sử")
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const selectedRecord = chart?.records.find((r) => r.toothNumber === selectedTooth)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          title="Quay lại"
          aria-label="Quay lại danh sách bệnh nhân"
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Sơ đồ răng</h1>
          <div className="flex items-center text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span>{patient?.fullName ?? "Không tải được thông tin bệnh nhân"}</span>
            )}
            {chart?.isChildPatient && (
              <Badge variant="secondary" className="ml-2">
                Răng sữa
              </Badge>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6">
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-64 w-full max-w-lg" />
        </div>
      )}

      {!isLoading && loadError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-10 text-muted-foreground">
          <AlertCircle className="size-8" />
          <p>Không tải được sơ đồ răng. Vui lòng thử lại.</p>
          <Button variant="outline" size="sm" onClick={() => void loadData()}>
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && chart && (
        <>
          <div className="flex flex-wrap gap-3 rounded-lg border bg-card p-4">
            {TOOTH_STATUS_NAMES.map((name, value) => (
              <div key={name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block size-3 rounded-sm border border-border"
                  style={{ backgroundColor: TOOTH_STATUS_COLORS[value as ToothStatus] }}
                />
                {TOOTH_STATUS_LABELS_VI[value as ToothStatus]}
              </div>
            ))}
          </div>

          <div className="flex justify-center rounded-lg border bg-card p-6">
            <ToothChartSvg
              isChildPatient={chart.isChildPatient}
              records={chart.records}
              selectedTooth={selectedTooth}
              onToothClick={openToothDialog}
            />
          </div>
        </>
      )}

      <Dialog
        open={selectedTooth !== null}
        onOpenChange={(open) => !open && setSelectedTooth(null)}
      >
        <DialogContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Răng số {selectedTooth}</DialogTitle>
            </DialogHeader>

            {selectedRecord && (
              <p className="text-sm text-muted-foreground">
                Cập nhật lần cuối:{" "}
                {new Date(selectedRecord.lastUpdated).toLocaleString("vi-VN")}
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="tooth-status">Tình trạng</Label>
              <Select
                value={statusValue}
                onValueChange={(value: ToothStatusName) => setStatusValue(value)}
              >
                <SelectTrigger id="tooth-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOTH_STATUS_NAMES.map((name, value) => (
                    <SelectItem key={name} value={name}>
                      {TOOTH_STATUS_LABELS_VI[value as ToothStatus]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tooth-notes">Ghi chú</Label>
              <Textarea
                id="tooth-notes"
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 rounded-md border p-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadHistory()}
                disabled={isLoadingHistory}
              >
                <History className="size-4" />
                {isLoadingHistory ? "Đang tải..." : "Xem lịch sử"}
              </Button>

              {history !== null && (
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto text-sm">
                  {history.length === 0 && (
                    <p className="text-muted-foreground">Răng này chưa có lịch sử.</p>
                  )}
                  {history.map((entry, index) => (
                    <div key={index} className="border-b pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {TOOTH_STATUS_LABELS_VI[entry.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.recordedAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="mt-1 text-muted-foreground">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
