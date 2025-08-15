"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Map } from "lucide-react"
import { useDashboard } from "@/contexts/dashboard-context"

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'roadmap-editor', label: 'Roadmap Editor', icon: Map },
]

export function CoachSidebar() {
  const { activeSection, setActiveSection } = useDashboard()

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Coach Dashboard</h2>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => {
                console.log('Sidebar clicked:', item.id)
                setActiveSection(item.id)
              }}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>
    </div>
  )
} 