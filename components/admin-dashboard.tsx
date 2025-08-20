"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, TrendingUp, CheckCircle, DollarSign, Building2, UserCheck, BookOpen } from "lucide-react"

interface Coach {
  id: string
  user_id: string
  business_name: string
  bio?: string
  specialization?: string
  hourly_rate?: number
  name: string
  email: string
  created_at: string
}

interface CoachStats {
  totalCustomers: number
  totalPrograms: number
  totalRevenue: number
  activePrograms: number
}

interface Program {
  id: string
  name: string
  description: string
  calculated_duration?: number
  price: number
  is_active: boolean
  created_at: string
  coach_name: string
  enrolled_customers: number
}

interface Customer {
  id: string
  name: string
  email: string
  enrolled_programs: number
  completed_milestones: number
  total_spent: number
}

export function AdminDashboard() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)
  const [coachStats, setCoachStats] = useState<CoachStats>({
    totalCustomers: 0,
    totalPrograms: 0,
    totalRevenue: 0,
    activePrograms: 0
  })
  const [programs, setPrograms] = useState<Program[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCoaches()
  }, [])

  useEffect(() => {
    if (selectedCoach) {
      fetchCoachData(selectedCoach.id)
    }
  }, [selectedCoach])

  const fetchCoaches = async () => {
    try {
      const response = await fetch('/api/admin/coaches')
      if (response.ok) {
        const data = await response.json()
        setCoaches(data.coaches)
        if (data.coaches.length > 0) {
          setSelectedCoach(data.coaches[0])
        }
      }
    } catch (error) {
      console.error('Error fetching coaches:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCoachData = async (coachId: string) => {
    try {
      const [statsResponse, programsResponse, customersResponse] = await Promise.all([
        fetch(`/api/admin/coaches/${coachId}/stats`),
        fetch(`/api/admin/coaches/${coachId}/programs`),
        fetch(`/api/admin/coaches/${coachId}/customers`)
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setCoachStats(statsData.stats)
      }

      if (programsResponse.ok) {
        const programsData = await programsResponse.json()
        setPrograms(programsData.programs)
      }

      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        setCustomers(customersData.customers)
      }
    } catch (error) {
      console.error('Error fetching coach data:', error)
    }
  }

  const overallStats = [
    {
      title: "Total Coaches",
      value: coaches.length.toString(),
      change: "+" + coaches.length + " active",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Total Customers",
      value: coaches.reduce((sum, coach) => sum + (coachStats.totalCustomers || 0), 0).toString(),
      change: "Across all coaches",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Total Programs",
      value: coaches.reduce((sum, coach) => sum + (coachStats.totalPrograms || 0), 0).toString(),
      change: "Active programs",
      icon: BookOpen,
      color: "text-purple-600",
    },
    {
      title: "Total Revenue",
      value: "$" + coaches.reduce((sum, coach) => sum + (coachStats.totalRevenue || 0), 0).toLocaleString(),
      change: "All time",
      icon: DollarSign,
      color: "text-emerald-600",
    },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Multi-Tenant Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of all coaches and their businesses</p>
      </div>

      {/* Overall Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overallStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Coach Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Coach to View Details</CardTitle>
          <CardDescription>Choose a coach to see their specific data and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map((coach) => (
              <Button
                key={coach.id}
                variant={selectedCoach?.id === coach.id ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-start"
                onClick={() => setSelectedCoach(coach)}
              >
                <div className="font-semibold text-left">{coach.business_name}</div>
                <div className="text-sm text-muted-foreground text-left">{coach.name}</div>
                <div className="text-xs text-muted-foreground text-left">{coach.specialization}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCoach && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selectedCoach.business_name} - Coach Dashboard</CardTitle>
              <CardDescription>Coach: {selectedCoach.name} | Specialization: {selectedCoach.specialization}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{coachStats.totalCustomers}</div>
                  <div className="text-sm text-gray-600">Total Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{coachStats.totalPrograms}</div>
                  <div className="text-sm text-gray-600">Active Programs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{coachStats.activePrograms}</div>
                  <div className="text-sm text-gray-600">Active Enrollments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">${coachStats.totalRevenue?.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="programs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="programs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Coaching Programs</CardTitle>
                  <CardDescription>Programs offered by {selectedCoach.business_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program Name</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell className="font-medium">{program.name}</TableCell>
                          <TableCell>{program.calculated_duration || 0} days</TableCell>
                          <TableCell>${program.price}</TableCell>
                          <TableCell>{program.enrolled_customers}</TableCell>
                          <TableCell>${(program.price * program.enrolled_customers).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Base</CardTitle>
                  <CardDescription>Customers enrolled in {selectedCoach.business_name} programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Programs</TableHead>
                        <TableHead>Milestones</TableHead>
                        <TableHead>Total Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.enrolled_programs}</TableCell>
                          <TableCell>{customer.completed_milestones}</TableCell>
                          <TableCell>${customer.total_spent.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators for {selectedCoach.business_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Customer Engagement</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Active Customers</span>
                          <span className="font-medium">{coachStats.totalCustomers}</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold">Revenue Growth</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Monthly Revenue</span>
                          <span className="font-medium">${Math.floor(coachStats.totalRevenue / 12).toLocaleString()}</span>
                        </div>
                        <Progress value={60} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
