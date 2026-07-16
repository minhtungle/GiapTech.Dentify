import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "oidc-client-ts"
import { userManager } from "./userManager"
import { applicationConfigurationApi } from "@/lib/application-configuration-api"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isPermissionsLoading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  // Kiểm tra "có ít nhất 1 quyền (cha hoặc con) bắt đầu bằng prefix này không" — dùng
  // prefix thay vì so khớp đúng 1 permission cha vì một số role (ví dụ Doctor) chỉ được
  // seed permission con (Appointments.Update) mà không có permission cha
  // (Appointments.Default). So khớp đúng chuỗi permission cha sẽ khiến các role đó mất
  // menu dù họ thực sự cần dùng tính năng đó — xem docs/PROGRESS.md mục liên quan.
  hasPermissionPrefix: (prefix: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [grantedPolicies, setGrantedPolicies] = useState<Record<string, boolean> | null>(null)
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(true)

  useEffect(() => {
    userManager
      .getUser()
      .then((storedUser) => setUser(storedUser && !storedUser.expired ? storedUser : null))
      .finally(() => setIsLoading(false))

    const onUserLoaded = (loadedUser: User) => setUser(loadedUser)
    const onUserUnloaded = () => {
      setUser(null)
      setGrantedPolicies(null)
    }

    userManager.events.addUserLoaded(onUserLoaded)
    userManager.events.addUserUnloaded(onUserUnloaded)

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded)
      userManager.events.removeUserUnloaded(onUserUnloaded)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setGrantedPolicies(null)
      setIsPermissionsLoading(false)
      return
    }
    let cancelled = false
    setIsPermissionsLoading(true)
    applicationConfigurationApi
      .get()
      .then((config) => {
        if (!cancelled) setGrantedPolicies(config.auth.grantedPolicies)
      })
      .catch(() => {
        if (!cancelled) setGrantedPolicies(null)
      })
      .finally(() => {
        if (!cancelled) setIsPermissionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const hasPermissionPrefix = (prefix: string): boolean => {
    if (!grantedPolicies) return false
    return Object.entries(grantedPolicies).some(([key, granted]) => granted && key.startsWith(prefix))
  }

  const signIn = async () => {
    await userManager.signinRedirect()
  }

  const signOut = async () => {
    await userManager.signoutRedirect()
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isPermissionsLoading, signIn, signOut, hasPermissionPrefix }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
