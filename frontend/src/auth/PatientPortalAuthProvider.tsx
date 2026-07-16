import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "oidc-client-ts"
import { patientPortalUserManager } from "./patientPortalUserManager"

interface PatientPortalAuthContextValue {
  user: User | null
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const PatientPortalAuthContext = createContext<PatientPortalAuthContextValue | undefined>(
  undefined,
)

export function PatientPortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    patientPortalUserManager
      .getUser()
      .then((storedUser) => setUser(storedUser && !storedUser.expired ? storedUser : null))
      .finally(() => setIsLoading(false))

    const onUserLoaded = (loadedUser: User) => setUser(loadedUser)
    const onUserUnloaded = () => setUser(null)

    patientPortalUserManager.events.addUserLoaded(onUserLoaded)
    patientPortalUserManager.events.addUserUnloaded(onUserUnloaded)

    return () => {
      patientPortalUserManager.events.removeUserLoaded(onUserLoaded)
      patientPortalUserManager.events.removeUserUnloaded(onUserUnloaded)
    }
  }, [])

  const signIn = async () => {
    await patientPortalUserManager.signinRedirect()
  }

  const signOut = async () => {
    await patientPortalUserManager.signoutRedirect()
  }

  return (
    <PatientPortalAuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </PatientPortalAuthContext.Provider>
  )
}

export function usePatientPortalAuth() {
  const context = useContext(PatientPortalAuthContext)
  if (!context) {
    throw new Error("usePatientPortalAuth must be used within a PatientPortalAuthProvider")
  }
  return context
}
