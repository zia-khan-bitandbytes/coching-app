"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, CheckCircle, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"



export function CoachDashboard({ coachId }: { coachId: string }) {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalPrograms: 0,
    totalCustomers: 0,
    totalMilestones: 0,
    totalRevenue: 0,
    activeEnrollments: 0,
    monthlyRevenue: 0,
    completionRate: 0
  })

  useEffect(() => {
    fetchCoachData()
  }, [coachId])

  const fetchCoachData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch(`/api/coach/${coachId}/stats`)
      const statsData = await statsRes.json()
      console.log('Stats response:', statsData)
      if (statsData.success) {
        setStats(statsData.stats)
        console.log('Stats set to:', statsData.stats)
      }
    } catch (error) {
      console.error('Error fetching coach data:', error)
    }
  }



  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMilestones}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Your coaching business overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Business Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-medium">${stats.totalRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Revenue:</span>
                    <span className="font-medium">${stats.monthlyRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Enrollments:</span>
                    <span className="font-medium">{stats.activeEnrollments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate:</span>
                    <span className="font-medium">{stats.completionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Program Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Programs:</span>
                    <span className="font-medium">{stats.totalPrograms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Customers:</span>
                    <span className="font-medium">{stats.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Milestones:</span>
                    <span className="font-medium">{stats.totalMilestones}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 