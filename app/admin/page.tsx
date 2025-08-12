'use client'

import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  return (
    <DashboardLayout isAdmin={true}>
      <AdminDashboard />
    </DashboardLayout>
  )
}
