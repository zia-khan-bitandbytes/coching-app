"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskItem } from "@/components/task-item"
import { CheckCircle, Clock, Lock, ChevronDown, ChevronUp, Trash2, Edit3, Check, X } from "lucide-react"

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
  onDelete?: (milestoneId: number) => void
  onEdit?: (milestoneId: number, newTitle: string, newDescription: string) => void
}

export function MilestoneCard({ milestone, isExpanded, onToggle, onDelete, onEdit }: MilestoneCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(milestone.title)
  const [editDescription, setEditDescription] = useState(milestone.description)

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card toggle when clicking delete
    if (onDelete && window.confirm(`Are you sure you want to delete milestone "${milestone.title}"?`)) {
      onDelete(milestone.id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card toggle when clicking edit
    setIsEditing(true)
    setEditTitle(milestone.title)
    setEditDescription(milestone.description)
  }

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit && editTitle.trim()) {
      onEdit(milestone.id, editTitle.trim(), editDescription.trim())
      setIsEditing(false)
    }
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(false)
    setEditTitle(milestone.title)
    setEditDescription(milestone.description)
  }

  return (
    <Card className={milestone.status === "in-progress" ? "border-blue-200" : ""}>
      <CardHeader className={!isEditing ? "cursor-pointer" : ""} onClick={!isEditing ? onToggle : undefined}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {getStatusIcon(milestone.status)}
            {isEditing ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-lg font-semibold border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Milestone title"
                  onClick={(e) => e.stopPropagation()}
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Milestone description"
                  rows={2}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <CardTitle className="text-lg">{milestone.title}</CardTitle>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors duration-200 group"
                  title="Save changes"
                >
                  <Check className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200 group"
                  title="Cancel editing"
                >
                  <X className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                </button>
              </>
            ) : (
              <>
                {getStatusBadge(milestone.status)}
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200 group"
                    title="Edit milestone"
                  >
                    <Edit3 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 group"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                )}
                {milestone.tasks.length > 0 &&
                  (isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </>
            )}
          </div>
        </div>
        {!isEditing && milestone.description && <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>}
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
