"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { CoachSidebar } from "@/components/coach-sidebar"
import { useRouter } from "next/navigation"
import { User, LogOut, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RoadmapProvider, useRoadmap } from "@/contexts/roadmap-context"
import { DashboardProvider, useDashboard } from "@/contexts/dashboard-context"
import { CustomerRoadmap } from "@/components/customer-roadmap"
import { CoachDashboard } from "@/components/coach-dashboard"
import { RoadmapEditor } from "@/components/roadmap-editor"
import { MemberManagement } from "@/components/member-management"

interface CoachDashboardContentProps {
  user: { id: string; email: string; name: string; role: string; coach_id?: string; business_name?: string }
}

function CoachDashboardContent({ user }: CoachDashboardContentProps) {
  const { activeSection, setActiveSection } = useDashboard()

  // Set default section when component mounts
  useEffect(() => {
    if (user.role === 'coach') {
      setActiveSection("overview")
    }
  }, [user.role, setActiveSection])

  if (activeSection === "overview" || activeSection === "dashboard") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your coaching business performance</p>
          </div>
        </div>
        <CoachDashboard coachId={user.coach_id || user.id} />
      </div>
    )
  } else if (activeSection === "programs") {
    return (
      <div className="space-y-6">
        <RoadmapEditor coachId={user.coach_id || user.id} />
      </div>
    )
  } else if (activeSection === "customers") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-600 mt-1">Manage your coaching members</p>
          </div>
        </div>
        <MemberManagement />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your coaching business performance</p>
        </div>
      </div>
      <CoachDashboard coachId={user.coach_id || user.id} />
    </div>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
  isAdmin?: boolean
}

function RoadmapDropdown() {
  const { roadmaps, selectedRoadmapId, selectRoadmap } = useRoadmap()
  
  return (
    <div className="flex items-center">
      <h1 className="text-2xl font-bold text-gray-900">COACHING XYZ</h1>
      <div className="ml-20">
        <Select value={selectedRoadmapId || ""} onValueChange={selectRoadmap}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={roadmaps.length > 0 ? "Select roadmap" : "No roadmaps"} />
          </SelectTrigger>
          <SelectContent>
            {roadmaps.length > 0 ? (
              roadmaps.map((roadmap) => (
                <SelectItem key={roadmap.id} value={roadmap.id}>
                  {roadmap.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>
                No roadmaps
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function DashboardLayout({ children, isAdmin: propsIsAdmin }: DashboardLayoutProps) {
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string; coach_id?: string; business_name?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setUser(user)
    } else {
      router.push("/")
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem("user")
      router.push("/auth")
    }
  }



  if (!user) {
    return <div>Loading...</div>
  }

  const isAdmin = propsIsAdmin || user.role === 'super_admin'
  const isCoach = user.role === 'coach'
  const isCustomer = user.role === 'customer'

  // Render content based on current view and user role
  const renderMainContent = () => {
    if (isCustomer) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Learning Roadmap</h1>
              <p className="text-gray-600 mt-1">Track your progress and continue your journey</p>
            </div>
          </div>
          <CustomerRoadmap customerId={user.id?.toString() || ''} />
        </div>
      )
    }
    
    if (isCoach) {
      return <CoachDashboardContent user={user} />
    }
    
    // Default dashboard view for other roles
    return children
  }

  return (
    <DashboardProvider>
      <RoadmapProvider>
        <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {isCoach ? (
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">COACHING XYZ</h1>
                  <span className="ml-4 text-sm text-gray-600">Coach: {user.name}</span>
                </div>
              ) : isCustomer ? (
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">COACHING XYZ</h1>
                </div>
              ) : isAdmin ? (
                <h1 className="text-2xl font-bold text-gray-900">COACHING XYZ</h1>
              ) : (
                <RoadmapDropdown />
              )}


            </div>

            <div className="flex items-center gap-4">
              {!isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {user.name}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isCustomer && (
                      <DropdownMenuItem asChild>
                        <a href="/customer/settings">Edit Profile</a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Admin Account</span>
                  <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              )}

              <Avatar>
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex">
          {isAdmin ? <AdminSidebar /> : isCoach ? <CoachSidebar /> : <Sidebar />}
          <main className="flex-1 p-6">
            {renderMainContent()}
          </main>
        </div>
      </div>
      </RoadmapProvider>
    </DashboardProvider>
  )
}
