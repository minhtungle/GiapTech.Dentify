import type { ReactNode } from "react"
import { useEffect } from "react"
import { useAuth } from "@/auth/AuthProvider"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, signIn } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      void signIn()
    }
  }, [isLoading, user, signIn])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Đang xác thực...
      </div>
    )
  }

  return <>{children}</>
}
