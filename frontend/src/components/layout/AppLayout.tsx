import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { CalendarDays, FlaskConical, LogOut, Receipt, Smile, Users } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/patients", label: "Bệnh nhân", icon: Users },
  { to: "/appointments", label: "Lịch hẹn", icon: CalendarDays },
  { to: "/lab-works", label: "Labo", icon: FlaskConical },
  { to: "/expenses", label: "Chi phí", icon: Receipt },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r bg-card">
        <div className="flex items-center gap-2 px-4 py-4 text-lg font-semibold">
          <Smile className="size-6 text-primary" />
          Dentify
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t p-4">
          <div className="truncate text-sm text-muted-foreground">
            {user?.profile.name ?? user?.profile.email}
          </div>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOut />
            Đăng xuất
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
