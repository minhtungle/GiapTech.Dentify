import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { userManager } from "@/auth/userManager"

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    userManager
      .signinRedirectCallback()
      .then(() => navigate("/patients", { replace: true }))
      .catch((err: unknown) => {
        console.error(err)
        setError(err instanceof Error ? err.message : "Đăng nhập thất bại")
      })
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      {error ? `Lỗi đăng nhập: ${error}` : "Đang hoàn tất đăng nhập..."}
    </div>
  )
}
