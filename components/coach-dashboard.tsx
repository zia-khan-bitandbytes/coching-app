"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3
} from "lucide-react"
import { motion } from "framer-motion"

interface CoachDashboardProps {
  coachId?: string
}

export function CoachDashboard({ coachId }: CoachDashboardProps) {
  // Mock data for demonstration
  const kpiData = {
    totalClients: 247,
    clientSuccessRate: 75,
    timeToValue: 240,
    monthlyRevenue: 124500
  }

  const ttvBreakdown = [
    {
      milestone: "Milestone 1",
      completion: 28,
      goal: 30,
      status: "on-track",
      progress: 93
    },
    {
      milestone: "Milestone 2", 
      completion: 45,
      goal: 35,
      status: "over-target",
      progress: 78
    },
    {
      milestone: "Milestone 3",
      completion: 52,
      goal: 40,
      status: "over-target",
      progress: 77
    }
  ]

  const frictionZones = [
    {
      milestone: "Milestone 1",
      avgDays: 28,
      completion: 95,
      frictionLevel: "Low",
      status: "low"
    },
    {
      milestone: "Milestone 2",
      avgDays: 45,
      completion: 87,
      frictionLevel: "Medium",
      status: "medium"
    },
    {
      milestone: "Milestone 3",
      avgDays: 52,
      completion: 70,
      frictionLevel: "High Friction",
      status: "high"
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on-track":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "over-target":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      default:
        return <Target className="h-5 w-5 text-gray-500" />
    }
  }

  const getFrictionBadge = (level: string) => {
    switch (level) {
      case "low":
        return <Badge variant="secondary" className="bg-gray-900 text-white">Low</Badge>
      case "medium":
        return <Badge variant="secondary" className="bg-gray-900 text-white">Medium</Badge>
      case "high":
        return <Badge variant="destructive">High Friction</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getFrictionIcon = (status: string) => {
    switch (status) {
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Target className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.clientSuccessRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Time to Value</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData.timeToValue} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${kpiData.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Time to Value Breakdown */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Time to Value Breakdown</CardTitle>
            </div>
            <p className="text-sm text-gray-600">Average days to complete each milestone</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {ttvBreakdown.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium text-gray-700">{item.milestone}:</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{item.completion} days</span>
                    <span className="text-sm text-gray-500 ml-1">(Goal: {item.goal}d)</span>
                  </div>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Friction Zones Heatmap */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Friction Zones Heatmap</CardTitle>
            </div>
            <p className="text-sm text-gray-600">Where clients spend the most time and struggle</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {frictionZones.map((zone, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getFrictionIcon(zone.status)}
                  <div>
                    <span className="font-medium text-gray-700">{zone.milestone}</span>
                    <p className="text-sm text-gray-500">
                      {zone.avgDays} days avg • {zone.completion}% completion
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getFrictionBadge(zone.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Performance Insights</CardTitle>
            </div>
            <p className="text-sm text-gray-600">Key areas to focus on for improvement</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">28</div>
                <div className="text-sm text-blue-600 font-medium">Avg Days to First Milestone</div>
                <div className="text-xs text-gray-500 mt-1">Target: 30 days</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">87%</div>
                <div className="text-sm text-orange-600 font-medium">Milestone 2 Completion</div>
                <div className="text-xs text-gray-500 mt-1">Needs attention</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">70%</div>
                <div className="text-sm text-red-600 font-medium">Final Milestone Success</div>
                <div className="text-xs text-gray-500 mt-1">Critical area</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 