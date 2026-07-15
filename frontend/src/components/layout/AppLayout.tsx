import { useState } from "react"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { NavLink } from "react-router-dom"
import {
  Armchair,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  ClipboardPlus,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  // Prefix permission (ví dụ "Dentify.Appointments") — mục hiện nếu user có ít nhất 1
  // quyền (cha hoặc con) bắt đầu bằng prefix này. Không có nghĩa là luôn hiện, không gate.
  permissionPrefix?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { to: "/", label: "Trang chủ", icon: LayoutDashboard, end: true },
      { to: "/statistics", label: "Thống kê", icon: BarChart3, permissionPrefix: "Dentify.Statistics" },
    ],
  },
  {
    label: "Khám chữa bệnh",
    items: [
      { to: "/patients", label: "Bệnh nhân", icon: Users, permissionPrefix: "Dentify.Patients" },
      { to: "/appointments", label: "Lịch hẹn", icon: CalendarDays, permissionPrefix: "Dentify.Appointments" },
      { to: "/waitlist", label: "Danh sách chờ", icon: ClipboardList, permissionPrefix: "Dentify.Waitlist" },
      { to: "/lab-works", label: "Labo", icon: FlaskConical, permissionPrefix: "Dentify.LabWorks" },
    ],
  },
  {
    label: "Danh mục",
    items: [
      { to: "/doctors", label: "Bác sĩ", icon: Stethoscope, permissionPrefix: "Dentify.Doctors" },
      { to: "/services", label: "Dịch vụ", icon: ListTree, permissionPrefix: "Dentify.Services" },
      { to: "/drugs", label: "Danh mục thuốc", icon: PillBottle, permissionPrefix: "Dentify.Drugs" },
      { to: "/chairs", label: "Ghế nha khoa", icon: Armchair, permissionPrefix: "Dentify.Chairs" },
      { to: "/supplies", label: "Vật tư", icon: Package, permissionPrefix: "Dentify.Supplies" },
      { to: "/medical-catalogs", label: "Danh mục y khoa", icon: ClipboardPlus, permissionPrefix: "Dentify.MedicalTerms" },
    ],
  },
  {
    label: "Tài chính & vận hành",
    items: [
      { to: "/expenses", label: "Chi phí", icon: Receipt, permissionPrefix: "Dentify.Expenses" },
      { to: "/tasks", label: "Công việc", icon: CheckSquare, permissionPrefix: "Dentify.Tasks" },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { to: "/settings", label: "Cài đặt", icon: Settings, permissionPrefix: "Dentify.ClinicSettings" },
      { to: "/users", label: "Người dùng", icon: Users, permissionPrefix: "AbpIdentity.Users" },
      { to: "/roles", label: "Vai trò & phân quyền", icon: ShieldCheck, permissionPrefix: "AbpIdentity.Roles" },
    ],
  },
]

function SidebarNav({
  hasPermissionPrefix,
  isPermissionsLoading,
  onNavigate,
}: {
  hasPermissionPrefix: (prefix: string) => boolean
  isPermissionsLoading: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-3 px-2">
      {navGroups.map((group) => {
        const visibleItems = group.items.filter(
          (item) => !item.permissionPrefix || hasPermissionPrefix(item.permissionPrefix),
        )
        if (isPermissionsLoading) {
          return (
            <div key={group.label} className="flex flex-col gap-1">
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </div>
              {group.items.map((item) => (
                <Skeleton key={item.to} className="mx-3 h-8" />
              ))}
            </div>
          )
        }
        if (visibleItems.length === 0) return null
        return (
          <Collapsible key={group.label} defaultOpen>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
              {group.label}
              <ChevronDown className="size-3.5 transition-transform group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1">
              {visibleItems.map(({ to, label, icon: Icon, end }) => (
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
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </nav>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut, hasPermissionPrefix, isPermissionsLoading } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 px-4 py-4 text-lg font-semibold">
          <Smile className="size-6 text-primary" />
          Dentify
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav hasPermissionPrefix={hasPermissionPrefix} isPermissionsLoading={isPermissionsLoading} />
        </div>
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
            <div className="flex-1 overflow-y-auto">
              <SidebarNav
                hasPermissionPrefix={hasPermissionPrefix}
                isPermissionsLoading={isPermissionsLoading}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
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
