"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BarChart3, Users, CreditCard, Settings, Map } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, href: "/admin" },
  { id: "members", label: "Members", icon: Users, href: "/admin/members" },
  { id: "payments", label: "Payments", icon: CreditCard, href: "/admin/payments" },
  { id: "roadmap", label: "Roadmap Editor", icon: Map, href: "/admin/roadmap-editor" },
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
]

export function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3 text-left", isActive && "bg-blue-50 text-blue-700")}
              onClick={() => router.push(item.href)}
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
