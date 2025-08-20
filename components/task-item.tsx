"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CheckCircle, Lock, Trash2, Edit3, Check, X, File, ExternalLink, Download, Upload, XCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Task } from "@/lib/types"

// FileUpload component for customers
function FileUpload({ 
  taskId, 
  milestoneId, 
  customerId, 
  onFileUploaded 
}: { 
  taskId: number
  milestoneId?: number
  customerId?: string
  onFileUploaded: (file: any) => void 
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !milestoneId || !customerId) {
      toast({
        title: "Error",
        description: "Please select a file and ensure all required data is available",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('milestoneId', milestoneId.toString())
      formData.append('taskId', taskId.toString())

      const response = await fetch(`/api/customer/${customerId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Create file object for the UI
          const newFile = {
            id: result.file.id,
            name: result.file.original_filename,
            size: result.file.file_size,
            type: result.file.mime_type,
            url: `/api/files/${result.file.file_path}`,
            uploadedAt: result.file.uploaded_at
          }
          
          onFileUploaded(newFile)
          setSelectedFile(null)
          
          toast({
            title: "File uploaded successfully!",
            description: `${selectedFile.name} has been uploaded.`,
          })
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          onChange={handleFileSelect}
          accept="*/*"
          className="text-xs"
          disabled={isUploading}
        />
        {selectedFile && (
          <button
            onClick={removeSelectedFile}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
            disabled={isUploading}
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {selectedFile && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
          <File className="h-4 w-4 text-blue-500" />
          <span className="text-xs text-blue-700 font-medium truncate flex-1">
            {selectedFile.name}
          </span>
          <span className="text-xs text-gray-500">
            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
      )}
      
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        size="sm"
        className="w-full text-xs"
      >
        {isUploading ? (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-3 w-3 mr-1" />
            Upload File
          </>
        )}
      </Button>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  onDelete?: (taskId: number) => void
  onUpdate?: (taskId: number, updatedTask: Task) => void
  coachId?: string
  programId?: string
  milestoneId?: number
  allowEdit?: boolean
  allTasks?: Task[]
  customerId?: string
}

export function TaskItem({ task, onDelete, onUpdate, coachId, programId, milestoneId, allowEdit = true, allTasks = [], customerId }: TaskItemProps) {
  // Upload functionality removed - only customers can upload files
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [editRequiresUpload, setEditRequiresUpload] = useState(task.requiresUpload || false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [taskStatus, setTaskStatus] = useState(task.status || (task.completed ? "completed" : "in-progress"))

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Check if all previous tasks are completed
  const canCompleteTask = () => {
    if (allTasks.length === 0) return true
    
    const currentTaskIndex = task.order_index || 0
    const previousTasks = allTasks.filter(t => 
      (t.order_index || 0) < currentTaskIndex && 
      t.id !== task.id
    )
    
    return previousTasks.every(t => t.completed || t.status === "completed")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in-progress":
        return null
      case "locked":
        return <Lock className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const handleTaskCompletion = async (completed: boolean) => {
    if (!coachId || !programId || !milestoneId) {
      console.error('Missing required props for task completion')
      return
    }

    // Upload functionality removed - only customers can upload files

    // Check if previous tasks are completed
    if (!canCompleteTask() && completed) {
      toast({
        title: "Complete Previous Tasks First",
        description: "Please complete all previous tasks before marking this task as complete.",
        variant: "destructive",
      })
      return
    }

    setIsCompleting(true)
    try {
      const response = await fetch(
        `/api/coach/${coachId}/programs/${programId}/milestones/${milestoneId}/tasks?taskId=${task.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ completed })
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update local state
          const newStatus = completed ? "completed" : "in-progress"
          setTaskStatus(newStatus)
          
          // Update the task in the parent component
          const updatedTask = {
            ...task,
            completed: data.task.completed,
            status: newStatus as "completed" | "in-progress" | "locked"
          }
          onUpdate?.(task.id, updatedTask)
          
          toast({
            title: completed ? "Task completed!" : "Task marked as incomplete",
            description: `"${task.title}" has been ${completed ? 'marked as complete' : 'marked as incomplete'}.`,
            variant: "default",
          })
        } else {
          throw new Error(data.error || 'Failed to update task completion')
        }
      } else {
        throw new Error('Failed to update task completion')
      }
    } catch (error) {
      console.error('Error updating task completion:', error)
      toast({
        title: "Error",
        description: "Failed to update task completion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  // Upload functionality removed - only customers can upload files

  const handleEdit = () => {
    setIsEditing(true)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditRequiresUpload(task.requiresUpload || false)
  }

  const handleSaveEdit = async () => {
    if (!coachId || !programId || !milestoneId) {
      console.error('Missing required props for task update')
      return
    }

    if (!editTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty.",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(
        `/api/coach/${coachId}/programs/${programId}/milestones/${milestoneId}/tasks?taskId=${task.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription.trim() || null,
            requiresUpload: editRequiresUpload
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update the task in the parent component
          const updatedTask = {
            ...task,
            title: data.task.title,
            description: data.task.description,
            requiresUpload: data.task.requires_upload
          }
          onUpdate?.(task.id, updatedTask)
          setIsEditing(false)
          toast({
            title: "Task updated",
            description: `"${data.task.title}" has been successfully updated.`,
            variant: "default",
          })
        } else {
          throw new Error(data.error || 'Failed to update task')
        }
      } else {
        throw new Error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditRequiresUpload(task.requiresUpload || false)
  }

  const handleDelete = async () => {
    if (!coachId || !programId || !milestoneId) {
      console.error('Missing required props for task deletion')
      return
    }

    if (!confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/coach/${coachId}/programs/${programId}/milestones/${milestoneId}/tasks?taskId=${task.id}`,
        {
          method: 'DELETE'
        }
      )

      if (response.ok) {
        onDelete?.(task.id)
        toast({
          title: "Task deleted",
          description: `"${task.title}" has been successfully deleted.`,
          variant: "default",
        })
      } else {
        console.error('Failed to delete task')
        toast({
          title: "Error",
          description: "Failed to delete task. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        {/* Task completion checkbox */}
        <div className="relative">
          <Checkbox
            checked={taskStatus === "completed"}
            onCheckedChange={(checked) => handleTaskCompletion(checked as boolean)}
            disabled={isCompleting || 
              (!canCompleteTask() && taskStatus !== "completed")
            }
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !canCompleteTask() && taskStatus !== "completed"
                ? "Complete previous tasks first"
                : ""
            }
          />
          {!canCompleteTask() && taskStatus !== "completed" && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" title="Complete previous tasks first"></div>
          )}
        </div>
        {getStatusIcon(taskStatus)}
        {isEditing ? (
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task title"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task description"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id={`requiresUpload-${task.id}`}
                checked={editRequiresUpload}
                onCheckedChange={(checked) => setEditRequiresUpload(checked as boolean)}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor={`requiresUpload-${task.id}`} className="text-xs text-gray-600">
                Requires file upload
              </Label>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${taskStatus === "completed" ? "line-through text-gray-500" : ""}`}>
                {task.title}
              </span>
              {/* Show upload requirement indicator */}
              {task.requiresUpload && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-xs text-orange-600 font-medium">Upload Required</span>
                  {/* Show warning if no files uploaded */}
                  {(!task.files || task.files.length === 0) && (
                    <span className="text-xs text-red-500 font-medium">(No files uploaded)</span>
                  )}
                </div>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
            )}
            
            {/* Display uploaded files */}
            {task.files && task.files.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-600">Uploaded Files:</p>
                <div className="space-y-1">
                  {task.files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors group">
                      {/* File type icon */}
                      <div className="flex-shrink-0">
                        {file.type?.startsWith('image/') ? (
                          <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                            <span className="text-xs text-green-600">🖼️</span>
                          </div>
                        ) : file.type?.includes('pdf') ? (
                          <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs text-red-600">📄</span>
                          </div>
                        ) : file.type?.includes('word') || file.type?.includes('document') ? (
                          <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-xs text-blue-600">📝</span>
                          </div>
                        ) : file.type?.includes('excel') || file.type?.includes('spreadsheet') ? (
                          <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                            <span className="text-xs text-green-600">📊</span>
                          </div>
                        ) : (
                          <File className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      
                      {/* File name and info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-blue-600 font-medium truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                        </div>
                      </div>
                      
                      {/* Download button */}
                      <button
                        onClick={async () => {
                          console.log('Downloading file:', file)
                          console.log('File URL:', file.url)
                          console.log('File name:', file.name)
                          
                          if (!file.url) {
                            toast({
                              title: "Error",
                              description: "File URL is not available",
                              variant: "destructive"
                            })
                            return
                          }
                          
                          try {
                            // Fetch the file
                            const response = await fetch(file.url)
                            if (!response.ok) {
                              throw new Error(`HTTP error! status: ${response.status}`)
                            }
                            
                            // Get the file blob
                            const blob = await response.blob()
                            
                            // Create a download link
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = file.name
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            
                            // Clean up the URL object
                            window.URL.revokeObjectURL(url)
                            
                            toast({
                              title: "Download started",
                              description: `${file.name} is being downloaded`,
                            })
                          } catch (error) {
                            console.error('Download error:', error)
                            toast({
                              title: "Download failed",
                              description: "Failed to download the file. Please try again.",
                              variant: "destructive"
                            })
                          }
                        }}
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-200 rounded transition-colors flex-shrink-0"
                        title={`Download ${file.name}`}
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* File upload section for customers */}
            {!allowEdit && task.requiresUpload && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-orange-100 rounded flex items-center justify-center">
                    <span className="text-xs text-orange-600">📁</span>
                  </div>
                  <p className="text-xs font-medium text-orange-700">Upload Required</p>
                </div>
                
                {(!task.files || task.files.length === 0) ? (
                  <div className="space-y-2">
                    <p className="text-xs text-orange-600">
                      This task requires you to upload a file to complete it.
                    </p>
                    <FileUpload 
                      taskId={task.id}
                      milestoneId={milestoneId}
                      customerId={customerId}
                      onFileUploaded={(newFile: any) => {
                        // Update the task with the new file
                        const updatedTask = {
                          ...task,
                          files: [...(task.files || []), newFile]
                        }
                        onUpdate?.(task.id, updatedTask)
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-xs text-green-600">
                    ✓ Files uploaded successfully
                  </div>
                )}
              </div>
            )}
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-1 text-xs text-gray-400">
                Files: {task.files ? task.files.length : 0}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              disabled={isUpdating}
              className="p-1.5 text-green-600 hover:text-white hover:bg-green-600 bg-green-50 border border-green-200 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50"
              title="Save changes"
            >
              {isUpdating ? (
                <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className="p-1.5 text-gray-600 hover:text-white hover:bg-gray-600 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50"
              title="Cancel editing"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            {/* Upload functionality removed from coach side - only customers can upload files */}

            {task.status === "locked" && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                Locked
              </Badge>
            )}

            {taskStatus === "completed" && <Badge className="bg-green-100 text-green-700">Done</Badge>}
            
            {taskStatus === "locked" && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                Locked
              </Badge>
            )}
            
            {/* Edit button - show if we have the required props */}
            {allowEdit && coachId && programId && milestoneId && (
              <button
                onClick={handleEdit}
                className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-200 rounded-lg shadow-sm transition-all duration-200"
                title="Edit task"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            
            {/* Delete button - always show if we have the required props */}
            {allowEdit && coachId && programId && milestoneId && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50"
                title="Delete task"
              >
                {isDeleting ? (
                  <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
