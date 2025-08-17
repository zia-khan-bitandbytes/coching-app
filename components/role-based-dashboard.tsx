"use client"

import { useState, useEffect } from "react"
import { useRoadmap } from "@/contexts/roadmap-context"
import { useDashboard } from "@/contexts/dashboard-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole, getRoleDisplayName } from "@/lib/auth-client"
import Link from "next/link"
import { CustomerRoadmap } from "@/components/customer-roadmap"
import { CoachDashboard } from "@/components/coach-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"
import { MemberManagement } from "@/components/member-management"
import { RoadmapEditor } from "@/components/roadmap-editor"
import { PaymentManagement } from "@/components/payment-management"
import { CoachSettings } from "@/components/coach-settings"

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
  const { activeSection } = useDashboard()
  
  // Debug logging
  console.log('RoleBasedDashboard rendered with user:', user)
  console.log('User role:', user.role)
  console.log('Active section:', activeSection)
  
  const renderCustomerDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Learning Roadmap</h1>
          <p className="text-gray-600 mt-1">Track your progress and continue your journey</p>
        </div>
      </div>
      <CustomerRoadmap customerId={user.id} />
    </div>
  )

  const renderCoachDashboard = () => {
    console.log('CoachDashboard: user.coach_id =', user.coach_id)
    if (!user.coach_id) {
      return (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Coach Profile Not Found</h2>
          <p className="text-muted-foreground">Please contact support to set up your coach profile.</p>
          <p className="text-sm text-gray-500 mt-2">User ID: {user.id}, Role: {user.role}</p>
        </div>
      )
    }
    
    // Render different sections based on activeSection
    console.log('CoachDashboard: rendering section:', activeSection)
    switch (activeSection) {
      case 'dashboard':
        return <CoachDashboard coachId={user.coach_id} />
      case 'members':
        console.log('CoachDashboard: rendering MemberManagement component')
        return <MemberManagement />
      case 'roadmap-editor':
        return user.coach_id ? <RoadmapEditor coachId={user.coach_id} /> : (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Coach Profile Not Found</h2>
            <p className="text-muted-foreground">Please contact support to set up your coach profile.</p>
          </div>
        )
      default:
        return user.coach_id ? <CoachDashboard coachId={user.coach_id} /> : (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Coach Profile Not Found</h2>
            <p className="text-muted-foreground">Please contact support to set up your coach profile.</p>
          </div>
        )
    }
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