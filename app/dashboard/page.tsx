"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { RoleBasedDashboard } from "@/components/role-based-dashboard"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Your Dashboard</h1>
          <p className="text-muted-foreground">Track your coaching progress and milestones</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">My Programs</h3>
            <p className="text-sm text-muted-foreground">View your enrolled coaching programs</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Progress</h3>
            <p className="text-sm text-muted-foreground">Track your milestone completion</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Payments</h3>
            <p className="text-sm text-muted-foreground">Manage your payment history</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
