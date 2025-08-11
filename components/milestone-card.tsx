"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskItem } from "@/components/task-item"
import { TaskCreationDialog } from "@/components/task-creation-dialog"
import { CheckCircle, Clock, Lock, ChevronDown, ChevronUp, Trash2, Edit3, Check, X } from "lucide-react"

interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
  order_index: number
  milestone_id: number
  created_at: string
  completed_at?: string
  status?: "completed" | "in-progress" | "blocked"
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
  coachId?: string
  programId?: string
}

export function MilestoneCard({ milestone, isExpanded, onToggle, onDelete, onEdit, coachId, programId }: MilestoneCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(milestone.title)
  const [editDescription, setEditDescription] = useState(milestone.description)
  const [tasks, setTasks] = useState<Task[]>(milestone.tasks || [])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)

  // Fetch tasks when milestone is expanded and we have required props
  useEffect(() => {
    if (isExpanded && coachId && programId && tasks.length === 0) {
      fetchTasks()
    }
  }, [isExpanded, coachId, programId])

  const fetchTasks = async () => {
    if (!coachId || !programId) return
    
    setIsLoadingTasks(true)
    try {
      const response = await fetch(
        `/api/coach/${coachId}/programs/${programId}/milestones/${milestone.id}/tasks`
      )
      const data = await response.json()
      
      if (data.success) {
        // Convert database tasks to match the expected format
        const formattedTasks = data.tasks.map((task: any) => ({
          ...task,
          status: task.completed ? "completed" : "in-progress"
        }))
        setTasks(formattedTasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const handleTaskCreated = (newTask: any) => {
    // Add the new task to the list with proper formatting
    const formattedTask = {
      ...newTask,
      status: newTask.completed ? "completed" : "in-progress"
    }
    setTasks(prev => [...prev, formattedTask])
  }

  const handleTaskDeleted = (taskId: number) => {
    // Remove the deleted task from the list
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

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
      <CardHeader className="">
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
                  className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 bg-green-50 border border-green-200 rounded-lg shadow-sm transition-all duration-200 group"
                  title="Save changes"
                >
                  <Check className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2.5 text-gray-600 hover:text-white hover:bg-gray-600 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all duration-200 group"
                  title="Cancel editing"
                >
                  <X className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                </button>
              </>
            ) : (
              <>
                {getStatusBadge(milestone.status)}
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="p-2.5 text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-200 rounded-lg shadow-sm transition-all duration-200 group"
                    title="Edit milestone"
                  >
                    <Edit3 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                )}
                {coachId && programId && (
                  <TaskCreationDialog
                    milestoneId={milestone.id}
                    milestoneTitle={milestone.title}
                    coachId={coachId}
                    programId={programId}
                    onTaskCreated={handleTaskCreated}
                  />
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200 rounded-lg shadow-sm transition-all duration-200 group"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                )}
                {(tasks.length > 0 || (coachId && programId)) && (
                  <div className="flex items-center gap-1">
                    {tasks.length > 0 && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                      }}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200 group"
                      title={isExpanded ? "Hide tasks" : "Show tasks"}
                    >
                      {isExpanded ? 
                        <ChevronUp className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" /> : 
                        <ChevronDown className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                      }
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {!isEditing && milestone.description && <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 border-t border-gray-100 bg-gray-50/30">
          <div className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tasks</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            {isLoadingTasks ? (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-sm text-gray-500">Loading tasks...</div>
                </div>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="animate-in slide-in-from-top-2 duration-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TaskItem 
                      task={{
                        id: task.id,
                        title: task.title,
                        status: task.status || (task.completed ? "completed" : "in-progress"),
                        requiresUpload: task.requiresUpload
                      }}
                      onDelete={handleTaskDeleted}
                      coachId={coachId}
                      programId={programId}
                      milestoneId={milestone.id}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <ChevronDown className="h-6 w-6 text-gray-400" />
                </div>
                <div className="text-sm text-gray-500 mb-1">No tasks yet</div>
                <div className="text-xs text-gray-400">
                  {coachId && programId ? "Click the + button above to add your first task!" : "Tasks will appear here when added."}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
