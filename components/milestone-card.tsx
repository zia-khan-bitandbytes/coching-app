"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskItem } from "@/components/task-item"
import { CheckCircle, Clock, Lock, ChevronDown, ChevronUp } from "lucide-react"

interface Task {
  id: number
  title: string
  status: "completed" | "in-progress" | "blocked"
  requiresUpload?: boolean
}

interface Milestone {
  id: number
  title: string
  status: "completed" | "in-progress" | "blocked"
  description: string
  tasks: Task[]
}

interface MilestoneCardProps {
  milestone: Milestone
  isExpanded: boolean
  onToggle: () => void
}

export function MilestoneCard({ milestone, isExpanded, onToggle }: MilestoneCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-600" />
      case "blocked":
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
      case "blocked":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            Blocked
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card className={milestone.status === "in-progress" ? "border-blue-200" : ""}>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(milestone.status)}
            <CardTitle className="text-lg">{milestone.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(milestone.status)}
            {milestone.tasks.length > 0 &&
              (isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
          </div>
        </div>
        {milestone.description && <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>}
      </CardHeader>

      {isExpanded && milestone.tasks.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {milestone.tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
