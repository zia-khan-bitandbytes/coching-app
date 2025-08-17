"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Map, BookOpen, HelpCircle, Users, BarChart3 } from "lucide-react"

const getNavigationItems = (userRole?: string) => {
  if (userRole === 'customer') {
    return [
      { id: "roadmap", label: "Roadmap", icon: Map, active: true },
      { id: "resources", label: "Resources", icon: BookOpen, active: false },
      { id: "support", label: "Support", icon: HelpCircle, active: false },
      { id: "community", label: "A Community", icon: Users, active: false },
    ]
  }
  
  if (userRole === 'coach') {
    return [
      { id: "dashboard", label: "Dashboard", icon: BarChart3, active: true },
      { id: "roadmap", label: "Roadmap", icon: Map, active: false },
      { id: "resources", label: "Resources", icon: BookOpen, active: false },
      { id: "support", label: "Support", icon: HelpCircle, active: false },
      { id: "community", label: "A Community", icon: Users, active: false },
    ]
  }
  
  if (userRole === 'coach') {
    return [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
      { id: "programs", label: "Programs", icon: BookOpen, active: false },
      { id: "customers", label: "Customers", icon: Users, active: false },
    ]
  }
  
  return [
    { id: "roadmap", label: "Roadmap", icon: Map, active: true },
    { id: "resources", label: "Resources", icon: BookOpen, active: false },
    { id: "support", label: "Support", icon: HelpCircle, active: false },
    { id: "community", label: "A Community", icon: Users, active: false },
  ]
}

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("dashboard")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setUser(user)
      // Set default active item based on user role
      if (user.role === 'customer') {
        // Customers only see roadmap view
        setActiveItem("roadmap")
        localStorage.setItem('customerActiveView', 'roadmap')
      } else if (user.role === 'coach') {
        // Coaches see dashboard by default
        setActiveItem("dashboard")
      } else {
        setActiveItem("roadmap")
      }
    }
  }, [])

  const handleRoadmapClick = () => {
    console.log('Roadmap clicked, isCustomer:', isCustomer)
    // For customers, clicking roadmap should show the roadmap component
    if (isCustomer) {
      // Show roadmap by setting active item
      setActiveItem("roadmap")
      // Store in localStorage to persist the selection
      localStorage.setItem('customerActiveView', 'roadmap')
      // Emit a custom event to notify the parent component
      window.dispatchEvent(new CustomEvent('sidebarViewChanged', { 
        detail: { view: 'roadmap' } 
      }))
    }
  }

  const handleDashboardClick = () => {
    if (user?.role === 'coach') {
      setActiveItem("dashboard")
      // Emit a custom event to notify the parent component
      window.dispatchEvent(new CustomEvent('sidebarViewChanged', { 
        detail: { view: 'dashboard' } 
      }))
    }
  }

  const handleCommunityClick = () => {
    // Community functionality removed - button remains but does nothing
    console.log('Community button clicked - functionality removed')
  }

  const handleProgramsClick = () => {
    setActiveItem("programs")
    // Communicate with coach dashboard
    localStorage.setItem("activeSection", "programs")
    // Trigger a custom event to notify the dashboard
    window.dispatchEvent(new CustomEvent('sectionChange', { detail: 'programs' }))
  }

  const handleCustomersClick = () => {
    setActiveItem("customers")
    // Communicate with coach dashboard
    localStorage.setItem("activeSection", "customers")
    // Trigger a custom event to notify the dashboard
    window.dispatchEvent(new CustomEvent('sectionChange', { detail: 'customers' }))
  }

  // Check if user is customer
  const isCustomer = user?.role === 'customer'
  const isCoach = user?.role === 'coach'

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <nav className="space-y-2">
        {getNavigationItems(user?.role).map((item) => {
          const Icon = item.icon
          
          // Only show Roadmap and Community for customers
          if (!isCustomer && (item.id === "roadmap" || item.id === "community")) {
            return null
          }
          
          return (
            <Button
              key={item.id}
              variant={activeItem === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 text-left",
                activeItem === item.id && "bg-blue-50 text-blue-700",
              )}
              onClick={() => {
                if (item.id === "community") {
                  handleCommunityClick()
                } else if (item.id === "roadmap") {
                  handleRoadmapClick()
                } else if (item.id === "dashboard") {
                  handleDashboardClick()
                } else {
                  setActiveItem(item.id)
                }
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
