'use client'

import { DashboardLayout } from "@/components/dashboard-layout"
import { MemberManagement } from "@/components/member-management"

export default function MembersPage() {
  // This page needs to get the coachId from the user context
  // For now, we'll need to handle this differently
  return (
    <DashboardLayout>
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Members Management</h2>
        <p className="text-muted-foreground">Please use the Members section from the main dashboard.</p>
      </div>
    </DashboardLayout>
  )
}
