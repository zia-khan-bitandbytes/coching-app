"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskItem } from "@/components/task-item"
import { TaskCreationDialog } from "@/components/task-creation-dialog"
import { CheckCircle, Clock, Lock, ChevronDown, ChevronUp, Trash2, Edit3, Check, X } from "lucide-react"
import { Task, Milestone } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface MilestoneCardProps {
  milestone: Milestone
  isExpanded: boolean
  onToggle: () => void
  onDelete?: (milestoneId: number) => void
  onEdit?: (milestoneId: number, newTitle: string, newDescription: string) => void
  coachId?: string
  programId?: string
  allowTaskCreation?: boolean
  customerId?: string
  allMilestones?: any[]
  onMilestoneCompleted?: (milestoneId: number) => void
}

export function MilestoneCard({ milestone, isExpanded, onToggle, onDelete, onEdit, coachId, programId, allowTaskCreation = true, customerId, allMilestones = [], onMilestoneCompleted }: MilestoneCardProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(milestone.title)
  const [editDescription, setEditDescription] = useState(milestone.description)
  const [tasks, setTasks] = useState<Task[]>(milestone.tasks || [])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)

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
          status: task.completed ? "completed" : "in-progress",
          requiresUpload: task.requiresUpload || false,
          files: task.files || []
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
    console.log('Handling task created:', newTask)
    // Add the new task to the list with proper formatting
    const formattedTask = {
      ...newTask,
      status: newTask.completed ? "completed" : "in-progress",
      requiresUpload: newTask.requiresUpload || false,
      files: newTask.files || []
    }
    console.log('Formatted task:', formattedTask)
    console.log('Task files:', formattedTask.files)
    setTasks(prev => [...prev, formattedTask])
  }

  const handleTaskDeleted = (taskId: number) => {
    // Remove the deleted task from the list
    const updatedTasks = tasks.filter(task => task.id !== taskId)
    setTasks(updatedTasks)
    
    // Note: We no longer automatically update milestone status when tasks are deleted
    // Milestone completion is now only manual through the "Mark as Complete" button
  }

  const handleTaskUpdated = (taskId: number, updatedTask: any) => {
    // Update the task in the list
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { 
        ...task, 
        ...updatedTask,
        requiresUpload: updatedTask.requiresUpload !== undefined ? updatedTask.requiresUpload : task.requiresUpload,
        files: updatedTask.files || task.files || []
      } : task
    )
    setTasks(updatedTasks)

    // Note: We no longer automatically update milestone status when all tasks are completed
    // Milestone completion is now only manual through the "Mark as Complete" button
  }



  // Check if all tasks are completed for button state
  const areAllTasksCompleted = () => {
    if (tasks.length === 0) return false
    
    return tasks.every(task => {
      const isCompleted = task.completed || task.status === "completed"
      
      // If task requires upload, check if files are uploaded
      if (task.requiresUpload) {
        const hasFiles = task.files && task.files.length > 0
        return isCompleted && hasFiles
      }
      
      return isCompleted
    })
  }

  // Check if milestone is unlocked (previous milestones are completed)
  const isMilestoneUnlocked = () => {
    if (allMilestones.length === 0) return true
    
    const currentMilestoneOrder = (milestone as any).order_index || 0
    
    // First milestone (order_index = 1) is always unlocked
    if (currentMilestoneOrder === 1) return true
    
    // For all other milestones, check if previous milestone is completed
    const previousMilestone = allMilestones.find(m => 
      ((m as any).order_index || 0) === currentMilestoneOrder - 1
    )
    
    // If no previous milestone found, milestone should be locked
    if (!previousMilestone) return false
    
    // Check if previous milestone is completed (either by completed property or status)
    const isPreviousCompleted = previousMilestone.completed === true || previousMilestone.status === "completed"
    
    return isPreviousCompleted
  }

  // Check if milestone is locked
  const isMilestoneLocked = () => {
    // If milestone is already completed, it's not locked
    if (milestone.status === "completed") return false
    
    // If the API provided an isLocked property, use that
    if ((milestone as any).isLocked !== undefined) {
      return (milestone as any).isLocked
    }
    
    // Otherwise, calculate based on previous milestone completion
    return !isMilestoneUnlocked()
  }

  // Get information about which milestone needs to be completed first
  const getNextUnlockableMilestone = () => {
    if (!isMilestoneLocked()) return null
    
    const currentMilestoneOrder = (milestone as any).order_index || 0
    if (currentMilestoneOrder <= 1) return null
    
    // Find the previous milestone that needs to be completed
    const previousMilestone = allMilestones.find(m => 
      ((m as any).order_index || 0) === currentMilestoneOrder - 1
    )
    
    return previousMilestone
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
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            Locked
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

  const handleMarkMilestoneComplete = async () => {
    if (!customerId) return

    setIsMarkingComplete(true)
    try {
      const response = await fetch(`/api/customer/${customerId}/milestones/${milestone.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
          notes: 'Manually marked as complete by customer'
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Call the parent's onMilestoneCompleted callback to update the UI
          if (onMilestoneCompleted) {
            onMilestoneCompleted(milestone.id)
          }
          
          // Show success toast
          toast({
            title: "Milestone Completed!",
            description: `"${milestone.title}" has been marked as complete.`,
            variant: "default",
          })
        }
      }
    } catch (error) {
      console.error('Error marking milestone complete:', error)
      toast({
        title: "Error",
        description: "Failed to mark milestone as complete. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingComplete(false)
    }
  }

  return (
    <Card className={`${milestone.status === "in-progress" ? "border-blue-200" : ""} ${isMilestoneLocked() ? "opacity-60 bg-gray-50" : ""}`}>
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {isMilestoneLocked() ? (
              <Lock className="h-5 w-5 text-gray-400" />
            ) : (
              getStatusIcon(milestone.status)
            )}
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
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{milestone.title}</CardTitle>
                {milestone.goal_days && (
                  <Badge variant="outline" className="text-xs">
                    Goal: {milestone.goal_days} days
                  </Badge>
                )}
                {isMilestoneLocked() && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Locked - Complete previous milestone first
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 bg-green-50 border border-green-200 rounded-lg shadow-sm transition-all duration-200"
                  title="Save changes"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2.5 text-gray-600 hover:text-white hover:bg-gray-600 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all duration-200"
                  title="Cancel editing"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                {getStatusBadge(milestone.status)}
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="px-3 py-2 text-blue-600 bg-blue-50 border border-blue-200 hover:text-blue-700 hover:bg-blue-100 hover:border-blue-300 rounded-lg shadow-sm flex items-center gap-1"
                    title="Edit milestone"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                )}
                {coachId && programId && allowTaskCreation && (
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
                    className="px-3 py-2 text-red-600 bg-red-50 border border-red-200 hover:text-red-700 hover:bg-red-100 hover:border-red-300 rounded-lg shadow-sm flex items-center gap-1"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
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
                        if (!isMilestoneLocked()) {
                          onToggle();
                        }
                      }}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        isMilestoneLocked() 
                          ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      title={isMilestoneLocked() ? 
                        `Complete "${getNextUnlockableMilestone()?.title}" first to unlock this milestone` : 
                        (isExpanded ? "Hide tasks" : "Show tasks")
                      }
                      disabled={isMilestoneLocked()}
                    >
                      {isExpanded ? 
                        <ChevronUp className="h-5 w-5" /> : 
                        <ChevronDown className="h-5 w-5" />
                      }
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {!isEditing && milestone.description && <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>}
        
        {/* Show helpful message for locked milestones */}
        {isMilestoneLocked() && getNextUnlockableMilestone() && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              <span className="font-medium">To unlock this milestone:</span> Complete "{getNextUnlockableMilestone()?.title}" first.
            </p>
          </div>
        )}
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
                        description: task.description,
                        status: task.status || (task.completed ? "completed" : "in-progress"),
                        requiresUpload: task.requiresUpload,
                        order_index: task.order_index,
                        files: task.files || []
                      }}
                      onDelete={handleTaskDeleted}
                      onUpdate={handleTaskUpdated}
                      coachId={coachId}
                      programId={programId}
                      milestoneId={milestone.id}
                      allowEdit={allowTaskCreation}
                      allTasks={tasks}
                      customerId={customerId}
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
                  {coachId && programId && allowTaskCreation ? "Click the + button above to add your first task!" : "Tasks will appear here when your coach adds them."}
                </div>
              </div>
            )}
            
            {/* Debug: Always show a test button for milestone completion */}
            {customerId && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700 mb-2">Debug Info:</p>
                <p className="text-xs text-yellow-600">Status: {milestone.status}</p>
                <p className="text-xs text-yellow-600">Locked: {isMilestoneLocked() ? 'Yes' : 'No'}</p>
                <p className="text-xs text-yellow-600">All Tasks Completed: {areAllTasksCompleted() ? 'Yes' : 'No'}</p>
                <p className="text-xs text-yellow-600">Tasks Count: {tasks.length}</p>
                <button
                  onClick={handleMarkMilestoneComplete}
                  className="mt-2 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                >
                  Test: Mark Complete
                </button>
              </div>
            )}
            
            {/* Mark Milestone Complete Button - Only show for customers when milestone is not already completed and unlocked */}
            {(() => {
              console.log('=== Milestone Completion Button Debug ===')
              console.log('customerId:', customerId)
              console.log('milestone.status:', milestone.status)
              console.log('isMilestoneLocked():', isMilestoneLocked())
              console.log('areAllTasksCompleted():', areAllTasksCompleted())
              console.log('tasks:', tasks)
              console.log('tasks.length:', tasks.length)
              
              return customerId && milestone.status !== "completed" && !isMilestoneLocked()
            })() && (
              <div className="flex flex-col items-center mt-6 pt-4 border-t border-gray-200">
                {/* Task completion progress indicator */}
                <div className="mb-3 text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    Task Progress: {tasks.filter(task => {
                      const isCompleted = task.completed || task.status === "completed"
                      if (task.requiresUpload) {
                        const hasFiles = task.files && task.files.length > 0
                        return isCompleted && hasFiles
                      }
                      return isCompleted
                    }).length} of {tasks.length} completed
                  </div>
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${tasks.length > 0 ? (tasks.filter(task => {
                          const isCompleted = task.completed || task.status === "completed"
                          if (task.requiresUpload) {
                            const hasFiles = task.files && task.files.length > 0
                            return isCompleted && hasFiles
                          }
                          return isCompleted
                        }).length / tasks.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  {/* Show upload requirements */}
                  {tasks.some(task => task.requiresUpload) && (
                    <div className="mt-2 text-xs text-orange-600">
                      ⚠️ Some tasks require file uploads to complete
                    </div>
                  )}
                </div>
                <button
                  onClick={handleMarkMilestoneComplete}
                  disabled={isMarkingComplete || !areAllTasksCompleted()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    areAllTasksCompleted() 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } ${isMarkingComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isMarkingComplete ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Marking Complete...
                    </>
                  ) : areAllTasksCompleted() ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Mark as Complete
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      Complete All Tasks First
                    </>
                  )}
                </button>
                {/* Show what's needed to complete */}
                {!areAllTasksCompleted() && (
                  <div className="mt-2 text-xs text-gray-500 text-center max-w-xs">
                    {(() => {
                      const incompleteTasks = tasks.filter(task => {
                        const isCompleted = task.completed || task.status === "completed"
                        if (task.requiresUpload) {
                          const hasFiles = task.files && task.files.length > 0
                          return !(isCompleted && hasFiles)
                        }
                        return !isCompleted
                      })
                      
                      if (incompleteTasks.length === 0) return null
                      
                      const needsUpload = incompleteTasks.filter(task => 
                        task.requiresUpload && (!task.files || task.files.length === 0)
                      )
                      const needsCompletion = incompleteTasks.filter(task => 
                        !(task.completed || task.status === "completed")
                      )
                      
                      let message = ""
                      if (needsCompletion.length > 0) {
                        message += `Complete ${needsCompletion.length} task${needsCompletion.length > 1 ? 's' : ''}`
                      }
                      if (needsUpload.length > 0) {
                        if (message) message += " and "
                        message += `upload files for ${needsUpload.length} task${needsUpload.length > 1 ? 's' : ''}`
                      }
                      
                      return message
                    })()}
                  </div>
                )}
              </div>
            )}
            
            {/* Completed Milestone Indicator */}
            {customerId && milestone.status === "completed" && (
              <div className="flex justify-center mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Milestone Completed
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
