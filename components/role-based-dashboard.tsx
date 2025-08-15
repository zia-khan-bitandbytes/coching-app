"use client"

import { useState, useEffect } from "react"
import { UserRole } from "@/lib/auth-client"
import { CustomerDashboard } from "@/components/customer-dashboard"
import { CoachDashboard } from "@/components/coach-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"

interface RoleBasedDashboardProps {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    coach_id?: string
    business_name?: string
  }
}

export function RoleBasedDashboard({ user }: RoleBasedDashboardProps) {
  // Debug logging
  console.log('RoleBasedDashboard rendered with user:', user)
  console.log('User role:', user.role)
  console.log('User coach_id:', user.coach_id)
  
  const renderCustomerDashboard = () => (
    <CustomerDashboard customerId={user.id} />
  )

  const renderCoachDashboard = () => {
    console.log('CoachDashboard: user.coach_id =', user.coach_id)
    if (!user.coach_id) {
      return (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Setting Up Your Coach Profile</h2>
          <p className="text-muted-foreground">Please wait while we set up your coach profile...</p>
          <p className="text-sm text-gray-500 mt-2">User ID: {user.id}, Role: {user.role}</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      )
    }
    
    return <CoachDashboard coachId={user.coach_id} />
  }

  const renderSuperAdminDashboard = () => (
    <AdminDashboard />
  )

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'customer':
      return renderCustomerDashboard()
    case 'coach':
      return renderCoachDashboard()
    case 'super_admin':
      return renderSuperAdminDashboard()
    default:
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Unknown Role</h2>
          <p className="text-muted-foreground">Please contact support for assistance.</p>
        </div>
      )
  }
} 