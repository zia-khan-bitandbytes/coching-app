"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserRole, getRoleDisplayName } from "@/lib/auth-client"
import Link from "next/link"

interface RoleBasedDashboardProps {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
}

export function RoleBasedDashboard({ user }: RoleBasedDashboardProps) {
  const renderCustomerDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">Track your coaching progress and milestones</p>
        </div>
        <Badge variant="secondary">{getRoleDisplayName(user.role)}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My Programs</CardTitle>
            <CardDescription>View your enrolled coaching programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">You have 2 active programs</p>
              <Button asChild className="w-full">
                <Link href="/customer/programs">View Programs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Track your milestone completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">65% of milestones completed</p>
              <Button asChild className="w-full">
                <Link href="/customer/progress">View Progress</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>Manage your payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">3 payments completed</p>
              <Button asChild className="w-full">
                <Link href="/customer/payments">View Payments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCoachDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coach Dashboard</h1>
          <p className="text-muted-foreground">Manage coaching programs and customer data</p>
        </div>
        <Badge variant="secondary">{getRoleDisplayName(user.role)}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Program Management</CardTitle>
            <CardDescription>Create and manage coaching programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">5 active programs</p>
              <Button asChild className="w-full">
                <Link href="/coach/programs">Manage Programs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Management</CardTitle>
            <CardDescription>View and manage your customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">12 active customers</p>
              <Button asChild className="w-full">
                <Link href="/coach/customers">Manage Customers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>Track payment history and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">$2,450 total revenue</p>
              <Button asChild className="w-full">
                <Link href="/coach/payments">View Payments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderSuperAdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Full system administration and management</p>
        </div>
        <Badge variant="secondary">{getRoleDisplayName(user.role)}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage all users and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">45 total users</p>
              <Button asChild className="w-full">
                <Link href="/admin/members">Manage Users</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>Monitor system performance and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">98% uptime this month</p>
              <Button asChild className="w-full">
                <Link href="/admin/overview">View Overview</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments & Revenue</CardTitle>
            <CardDescription>Track all payments and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">$12,450 total revenue</p>
              <Button asChild className="w-full">
                <Link href="/admin/payments">View Payments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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