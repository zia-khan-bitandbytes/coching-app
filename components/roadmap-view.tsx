"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MilestoneCard } from "@/components/milestone-card"
import { RoadmapProgress } from "@/components/roadmap-progress"
import { CheckCircle, Clock } from "lucide-react"

const milestones = [
  {
    id: 1,
    title: "Milestone 1",
    status: "completed" as const,
    description: "Foundation setup and initial assessment",
    tasks: [
      { id: 1, title: "Complete onboarding", status: "completed" as const },
      { id: 2, title: "Initial consultation", status: "completed" as const },
      { id: 3, title: "Goal setting session", status: "completed" as const },
    ],
  },
  {
    id: 2,
    title: "Milestone 2",
    status: "in-progress" as const,
    description: "Strategy development and planning",
    tasks: [
      { id: 4, title: "Action step 1", status: "completed" as const },
      { id: 5, title: "Upload your goal sheet for review", status: "in-progress" as const, requiresUpload: true },
      { id: 6, title: "Strategy review meeting", status: "blocked" as const },
    ],
  },
  {
    id: 3,
    title: "Milestone 3",
    status: "blocked" as const,
    description: "Implementation phase",
    tasks: [],
  },
  {
    id: 4,
    title: "Milestone 4",
    status: "blocked" as const,
    description: "Optimization and scaling",
    tasks: [],
  },
  {
    id: 5,
    title: "Milestone 5",
    status: "blocked" as const,
    description: "Final review and graduation",
    tasks: [],
  },
]

export function RoadmapView() {
  const [currentMilestone, setCurrentMilestone] = useState(2)

  const completedMilestones = milestones.filter((m) => m.status === "completed").length
  const totalMilestones = milestones.length
  const progressPercentage = (completedMilestones / totalMilestones) * 100

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ROADMAP</h1>
          <p className="text-gray-600 mt-1">Track your coaching journey</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">COACHING XYZ</div>
          <div className="text-lg font-semibold text-gray-900">$10k/month</div>
        </div>
      </div>

      {/* Roadmap Progress Visualization */}
      <RoadmapProgress milestones={milestones} currentMilestone={currentMilestone} />

      {/* Current Milestone Focus */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Milestone {currentMilestone}</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Clock className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700 font-medium">done</span>
            <span className="text-gray-600">in progress</span>
            <Button className="ml-auto">Done</Button>
          </div>
        </CardContent>
      </Card>

      {/* All Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            isExpanded={milestone.id === currentMilestone}
            onToggle={() => setCurrentMilestone(currentMilestone === milestone.id ? 0 : milestone.id)}
          />
        ))}
      </div>
    </div>
  )
}
