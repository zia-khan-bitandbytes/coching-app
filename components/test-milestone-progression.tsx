"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Lock, ChevronRight } from "lucide-react"

interface TestMilestone {
  id: number
  title: string
  description: string
  order_index: number
  status: "completed" | "in-progress" | "locked"
  isLocked: boolean
  tasks: { id: number; title: string; completed: boolean }[]
}

export function TestMilestoneProgression() {
  const [milestones, setMilestones] = useState<TestMilestone[]>([
    {
      id: 1,
      title: "Foundation Setup",
      description: "Complete onboarding and initial assessment",
      order_index: 1,
      status: "completed",
      isLocked: false,
      tasks: [
        { id: 1, title: "Complete profile", completed: true },
        { id: 2, title: "Take assessment", completed: true },
        { id: 3, title: "Set goals", completed: true }
      ]
    },
    {
      id: 2,
      title: "Goal Setting & Planning",
      description: "Define clear objectives and create action plans",
      order_index: 2,
      status: "completed",
      isLocked: false,
      tasks: [
        { id: 4, title: "Define SMART goals", completed: true },
        { id: 5, title: "Create action plan", completed: true },
        { id: 6, title: "Schedule milestones", completed: true }
      ]
    },
    {
      id: 3,
      title: "Strategy Development",
      description: "Develop comprehensive business strategies",
      order_index: 3,
      status: "in-progress",
      isLocked: false,
      tasks: [
        { id: 7, title: "Market research", completed: true },
        { id: 8, title: "Competitor analysis", completed: false },
        { id: 9, title: "Strategy formulation", completed: false }
      ]
    },
    {
      id: 4,
      title: "Implementation Phase",
      description: "Execute your strategic plans",
      order_index: 4,
      status: "locked",
      isLocked: true,
      tasks: [
        { id: 10, title: "Resource allocation", completed: false },
        { id: 11, title: "Team building", completed: false },
        { id: 12, title: "Process optimization", completed: false }
      ]
    },
    {
      id: 5,
      title: "Optimization & Scaling",
      description: "Optimize processes and scale operations",
      order_index: 5,
      status: "locked",
      isLocked: true,
      tasks: [
        { id: 13, title: "Performance analysis", completed: false },
        { id: 14, title: "Process improvement", completed: false },
        { id: 15, title: "Scale operations", completed: false }
      ]
    }
  ])

  const markMilestoneComplete = (milestoneId: number) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === milestoneId) {
        return { ...m, status: "completed" as const, isLocked: false }
      } else if (m.id === milestoneId + 1 && m.status === "locked") {
        // Unlock the next milestone
        return { ...m, status: "in-progress" as const, isLocked: false }
      }
      return m
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-600" />
      case "locked":
        return <Lock className="h-5 w-5 text-gray-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Done</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>
      case "locked":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Locked</Badge>
      default:
        return null
    }
  }

  const getNextUnlockableMilestone = (milestone: TestMilestone) => {
    if (!milestone.isLocked) return null
    return milestones.find(m => m.order_index === milestone.order_index - 1)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Milestone Progression Test</h1>
        <p className="text-gray-600">
          This demonstrates how milestones are locked/unlocked based on completion order.
          <br />
          <strong>Emma Davis has completed 2/4 milestones:</strong> Foundation Setup and Goal Setting are done.
          <br />
          Strategy Development is in progress and can be completed.
          <br />
          Implementation Phase is locked until Strategy Development is completed.
        </p>
      </div>

      <div className="grid gap-4">
        {milestones.map((milestone) => (
          <Card 
            key={milestone.id} 
            className={`${milestone.status === "in-progress" ? "border-blue-200" : ""} ${milestone.isLocked ? "opacity-60 bg-gray-50" : ""}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {milestone.isLocked ? (
                    <Lock className="h-5 w-5 text-gray-400" />
                  ) : (
                    getStatusIcon(milestone.status)
                  )}
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{milestone.title}</CardTitle>
                    {milestone.isLocked && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        Locked - Complete previous milestone first
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(milestone.status)}
                  <span className="text-sm text-gray-500">#{milestone.order_index}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
              
              {/* Show helpful message for locked milestones */}
              {milestone.isLocked && getNextUnlockableMilestone(milestone) && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700">
                    <span className="font-medium">To unlock this milestone:</span> Complete "{getNextUnlockableMilestone(milestone)?.title}" first.
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-700">Tasks</h4>
                  <span className="text-xs text-gray-500">
                    {milestone.tasks.filter(t => t.completed).length} of {milestone.tasks.length} completed
                  </span>
                </div>
                
                <div className="space-y-2">
                  {milestone.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={task.completed ? 'text-gray-500 line-through' : 'text-gray-700'}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2">
                  {milestone.status === "in-progress" && (
                    <Button
                      onClick={() => markMilestoneComplete(milestone.id)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                  
                  {milestone.status === "completed" && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Milestone Completed
                    </div>
                  )}
                  
                  {milestone.isLocked && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Lock className="h-4 w-4" />
                      Locked - Complete previous milestone first
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Milestone 1 & 2:</strong> Already completed - these unlock Milestone 3</li>
          <li>• <strong>Milestone 3:</strong> Currently in progress - can be completed to unlock Milestone 4</li>
          <li>• <strong>Milestone 4:</strong> Locked until Milestone 3 is completed</li>
          <li>• <strong>Milestone 5:</strong> Locked until Milestone 4 is completed</li>
        </ul>
        <p className="text-xs text-blue-700 mt-2">
          Try clicking "Mark Complete" on Milestone 3 to see Milestone 4 unlock!
        </p>
        
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <h4 className="font-medium text-green-900 mb-2">Test the Progression System</h4>
          <div className="text-sm text-green-800 space-y-2">
            <div>
              <strong>Current State:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Milestone 1: {milestones.find(m => m.id === 1)?.status} (should be completed)</li>
                <li>• Milestone 2: {milestones.find(m => m.id === 2)?.status} (should be completed)</li>
                <li>• Milestone 3: {milestones.find(m => m.id === 3)?.status} (should be in-progress)</li>
                <li>• Milestone 4: {milestones.find(m => m.id === 4)?.status} (should be locked)</li>
                <li>• Milestone 5: {milestones.find(m => m.id === 5)?.status} (should be locked)</li>
              </ul>
            </div>
            <div>
              <strong>Test Actions:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Click "Mark Complete" on Milestone 3</li>
                <li>• Watch Milestone 4 unlock and change from "locked" to "in-progress"</li>
                <li>• Milestone 5 remains locked until Milestone 4 is completed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
