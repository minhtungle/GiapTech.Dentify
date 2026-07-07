import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PatientToothChartPanel } from "@/components/tooth-chart/PatientToothChartPanel"
import { patientsApi } from "@/lib/patients-api"
import { ApiError } from "@/lib/api"
import type { PatientDto } from "@/types/patient"

export function ToothChartPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<PatientDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!patientId) return
    setIsLoading(true)
    patientsApi
      .get(patientId)
      .then(setPatient)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Không tải được thông tin bệnh nhân")
      })
      .finally(() => setIsLoading(false))
  }, [patientId])

  if (!patientId) return null

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
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <span className="text-sm text-muted-foreground">
              {patient?.fullName ?? "Không tải được thông tin bệnh nhân"}
            </span>
          )}
        </div>
      </div>

      <PatientToothChartPanel patientId={patientId} />
    </div>
  )
}
