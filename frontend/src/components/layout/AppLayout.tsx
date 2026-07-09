import { useState } from "react"
import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import {
  Armchair,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu,
  Package,
  PillBottle,
  Receipt,
  Settings,
  ShieldCheck,
  Smile,
  Stethoscope,
  Users,
} from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", label: "Trang chủ", icon: LayoutDashboard, end: true },
  { to: "/patients", label: "Bệnh nhân", icon: Users },
  { to: "/appointments", label: "Lịch hẹn", icon: CalendarDays },
  { to: "/waitlist", label: "Danh sách chờ", icon: ClipboardList },
  { to: "/doctors", label: "Bác sĩ", icon: Stethoscope },
  { to: "/services", label: "Dịch vụ", icon: ListTree },
  { to: "/drugs", label: "Danh mục thuốc", icon: PillBottle },
  { to: "/chairs", label: "Ghế nha khoa", icon: Armchair },
  { to: "/lab-works", label: "Labo", icon: FlaskConical },
  { to: "/expenses", label: "Chi phí", icon: Receipt },
  { to: "/supplies", label: "Vật tư", icon: Package },
  { to: "/tasks", label: "Công việc", icon: CheckSquare },
  { to: "/statistics", label: "Thống kê", icon: BarChart3 },
  { to: "/settings", label: "Cài đặt", icon: Settings },
]

const adminNavItems: typeof navItems = [
  { to: "/users", label: "Người dùng", icon: Users },
  { to: "/roles", label: "Vai trò & phân quyền", icon: ShieldCheck },
]

function hasAdminRole(role: unknown): boolean {
  if (Array.isArray(role)) return role.includes("admin")
  return role === "admin"
}

function SidebarNav({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean
  onNavigate?: () => void
}) {
  const items = isAdmin ? [...navItems, ...adminNavItems] : navItems
  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
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
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isAdmin = hasAdminRole(user?.profile.role)

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 px-4 py-4 text-lg font-semibold">
          <Smile className="size-6 text-primary" />
          Dentify
        </div>
        <SidebarNav isAdmin={isAdmin} />
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b bg-card px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mở menu điều hướng"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Smile className="size-5 text-primary" />
            Dentify
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogContent className="left-0 top-0 h-full max-h-none w-60 max-w-none translate-x-0 translate-y-0 rounded-none p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
          <DialogTitle className="sr-only">Menu điều hướng</DialogTitle>
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 px-4 py-4 text-lg font-semibold">
              <Smile className="size-6 text-primary" />
              Dentify
            </div>
            <SidebarNav isAdmin={isAdmin} onNavigate={() => setMobileNavOpen(false)} />
            <div className="mt-auto flex flex-col gap-2 border-t p-4">
              <div className="truncate text-sm text-muted-foreground">
                {user?.profile.name ?? user?.profile.email}
              </div>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                <LogOut />
                Đăng xuất
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
