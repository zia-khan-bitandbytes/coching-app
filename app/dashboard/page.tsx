"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RoleBasedDashboard } from "@/components/role-based-dashboard"
import { UserRole } from "@/lib/auth-client"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  coach_id?: string
  business_name?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get user data from localStorage first
        const userData = localStorage.getItem("user")
        if (userData) {
          const parsedUser = JSON.parse(userData)
          console.log('Dashboard: User data from localStorage:', parsedUser)
          
          // Fetch full user profile from database
          const response = await fetch(`/api/auth/profile/${parsedUser.id}`)
          if (response.ok) {
            const fullUser = await response.json()
            console.log('Dashboard: Full user profile from API:', fullUser)
            console.log('Dashboard: User coach_id:', fullUser.user.coach_id)
            setUser(fullUser.user)
          } else {
            // Fallback to localStorage data if API fails
            console.log('Dashboard: API failed, using localStorage data')
            console.log('Dashboard: localStorage user coach_id:', parsedUser.coach_id)
            setUser(parsedUser)
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // Fallback to localStorage data if there's an error
        const userData = localStorage.getItem("user")
        if (userData) {
          setUser(JSON.parse(userData))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No User Data</h2>
          <p className="text-muted-foreground">Please log in to access your dashboard.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout isAdmin={user.role === 'super_admin'}>
      <RoleBasedDashboard user={user} />
    </DashboardLayout>
  )
}
