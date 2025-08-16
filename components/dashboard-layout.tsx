"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"
import { User, LogOut, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RoadmapProvider, useRoadmap } from "@/contexts/roadmap-context"
import { DashboardProvider } from "@/contexts/dashboard-context"

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
  const [user, setUser] = useState<{ email: string; name: string; role: string; coach_id?: string; business_name?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
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

  const switchToAdmin = () => {
    router.push("/admin")
  }

  const switchToClient = () => {
    router.push("/dashboard")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const isAdmin = propsIsAdmin || user.role === 'super_admin'
  const isCoach = user.role === 'coach'
  const isCustomer = user.role === 'customer'

  return (
    <RoadmapProvider>
      <DashboardProvider>
        <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {isCoach ? (
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">{user.business_name || 'Coaching XYZ'}</h1>
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
                      {isCoach ? `${user.business_name || 'Coach'} - ${user.name}` : user.name}
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
        {isAdmin ? <AdminSidebar /> : <Sidebar />}
        <main className="flex-1 p-6">{children}</main>
              </div>
      </div>
      </DashboardProvider>
    </RoadmapProvider>
  )
}
