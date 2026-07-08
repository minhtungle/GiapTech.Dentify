import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, Loader2 } from "lucide-react"
import { patientPortalUserManager } from "@/auth/patientPortalUserManager"
import { Button } from "@/components/ui/button"

export function PortalAuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    patientPortalUserManager
      .signinRedirectCallback()
      .then(() => navigate("/portal", { replace: true }))
      .catch((err: unknown) => {
        console.error(err)
        setError(err instanceof Error ? err.message : "Đăng nhập thất bại")
      })
  }, [navigate])

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="size-10 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Đăng nhập thất bại</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/portal", { replace: true })}>
            Về trang chủ
          </Button>
          <Button onClick={() => void patientPortalUserManager.signinRedirect()}>
            Thử đăng nhập lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin" />
      Đang hoàn tất đăng nhập...
    </div>
  )
}
