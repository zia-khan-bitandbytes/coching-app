"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, CheckCircle, DollarSign } from "lucide-react"

const stats = [
  {
    title: "Total Clients",
    value: "247",
    change: "+12%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Active Programs",
    value: "3",
    change: "No change",
    icon: TrendingUp,
    color: "text-green-600",
  },
  {
    title: "Completed Milestones",
    value: "1,234",
    change: "+23%",
    icon: CheckCircle,
    color: "text-purple-600",
  },
  {
    title: "Monthly Revenue",
    value: "$124,500",
    change: "+8%",
    icon: DollarSign,
    color: "text-emerald-600",
  },
]

const recentActivity = [
  { client: "Sarah Johnson", action: "Completed Milestone 3", program: "Business Growth", time: "2 hours ago" },
  { client: "Mike Chen", action: "Uploaded document", program: "Leadership Mastery", time: "4 hours ago" },
  { client: "Emma Davis", action: "Started Milestone 2", program: "Sales Excellence", time: "6 hours ago" },
  { client: "John Smith", action: "Completed program", program: "Business Growth", time: "1 day ago" },
]

const programProgress = [
  { name: "Business Growth Program", completed: 45, total: 67, percentage: 67 },
  { name: "Leadership Mastery", completed: 23, total: 34, percentage: 68 },
  { name: "Sales Excellence", completed: 12, total: 18, percentage: 67 },
]

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your coaching business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Program Progress</CardTitle>
            <CardDescription>Client completion rates by program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {programProgress.map((program) => (
              <div key={program.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{program.name}</span>
                  <span className="text-gray-600">
                    {program.completed}/{program.total} clients
                  </span>
                </div>
                <Progress value={program.percentage} className="h-2" />
                <div className="text-xs text-gray-500">{program.percentage}% completion rate</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest client actions and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.client}</p>
                    <p className="text-xs text-gray-600">{activity.action}</p>
                    <Badge variant="secondary" className="text-xs">
                      {activity.program}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Completion Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone Completion Overview</CardTitle>
          <CardDescription>Track how clients are progressing through milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((milestone) => (
              <div key={milestone} className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-600">{Math.floor(Math.random() * 50) + 20}</div>
                <div className="text-sm text-gray-600">Milestone {milestone}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
