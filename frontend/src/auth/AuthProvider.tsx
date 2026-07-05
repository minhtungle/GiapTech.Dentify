import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "oidc-client-ts"
import { userManager } from "./userManager"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    userManager
      .getUser()
      .then((storedUser) => setUser(storedUser && !storedUser.expired ? storedUser : null))
      .finally(() => setIsLoading(false))

    const onUserLoaded = (loadedUser: User) => setUser(loadedUser)
    const onUserUnloaded = () => setUser(null)

    userManager.events.addUserLoaded(onUserLoaded)
    userManager.events.addUserUnloaded(onUserUnloaded)

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded)
      userManager.events.removeUserUnloaded(onUserUnloaded)
    }
  }, [])

  const signIn = async () => {
    await userManager.signinRedirect()
  }

  const signOut = async () => {
    await userManager.signoutRedirect()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
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
