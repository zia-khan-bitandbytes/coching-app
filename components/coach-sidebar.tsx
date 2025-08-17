"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BookOpen, Users, Settings, CreditCard } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useDashboard } from "@/contexts/dashboard-context"

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "roadmap-editor", label: "Roadmap Editor", icon: BookOpen },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
]

export function CoachSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { activeSection, setActiveSection } = useDashboard()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeSection || (item.id === "dashboard" && activeSection === "overview")
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3 text-left", isActive && "bg-gray-100 text-gray-900")}
              onClick={() => {
                setActiveSection(item.id)
              }}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
} 