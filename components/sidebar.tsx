"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Map, BookOpen, HelpCircle, Users } from "lucide-react"

const navigationItems = [
  { id: "roadmap", label: "Roadmap", icon: Map, active: true },
  { id: "resources", label: "Resources", icon: BookOpen, active: false },
  { id: "support", label: "Support", icon: HelpCircle, active: false },
  { id: "community", label: "A Community", icon: Users, active: false },
]

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("roadmap")

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeItem === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 text-left",
                activeItem === item.id && "bg-blue-50 text-blue-700",
              )}
              onClick={() => setActiveItem(item.id)}
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
