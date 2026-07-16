import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { LogOut, Smile } from "lucide-react"
import { usePatientPortalAuth } from "@/auth/PatientPortalAuthProvider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/portal", label: "Tổng quan", end: true },
  { to: "/portal/appointments", label: "Lịch hẹn" },
]

export function PortalLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = usePatientPortalAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Smile className="size-6 text-primary" />
            Dentify — Cổng bệnh nhân
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              {user?.profile.name ?? user?.profile.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              <LogOut />
              Đăng xuất
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 px-4">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "border-primary text-foreground",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
