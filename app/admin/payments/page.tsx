'use client'

import { DashboardLayout } from "@/components/dashboard-layout"
import { PaymentManagement } from "@/components/payment-management"

export default function PaymentsPage() {
  return (
    <DashboardLayout isAdmin={true}>
      <PaymentManagement />
    </DashboardLayout>
  )
}
