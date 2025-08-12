"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CheckCircle, Lock, Upload, Trash2, Edit3, Check, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Task } from "@/lib/types"

interface TaskItemProps {
  task: Task
  onDelete?: (taskId: number) => void
  onUpdate?: (taskId: number, updatedTask: Task) => void
  coachId?: string
  programId?: string
  milestoneId?: number
}

export function TaskItem({ task, onDelete, onUpdate, coachId, programId, milestoneId }: TaskItemProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [editRequiresUpload, setEditRequiresUpload] = useState(task.requiresUpload || false)
  const [isUpdating, setIsUpdating] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in-progress":
        return null
      case "blocked":
        return <Lock className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setIsUploading(true)

      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsUploading(false)
      // Here you would typically send the file to your backend
      console.log("File uploaded:", selectedFile.name)
    }
  }

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
        {getStatusIcon(task.status || "in-progress")}
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
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Task description (optional)"
              rows={2}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`requiresUpload-${task.id}`}
                checked={editRequiresUpload}
                onCheckedChange={(checked) => setEditRequiresUpload(checked as boolean)}
              />
              <Label
                htmlFor={`requiresUpload-${task.id}`}
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Upload require
              </Label>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
                {task.title}
              </span>
            </div>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
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
            {task.requiresUpload && task.status === "in-progress" && (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id={`file-${task.id}`}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <button
                  onClick={() => document.getElementById(`file-${task.id}`)?.click()}
                  disabled={isUploading}
                  className="p-1.5 text-yellow-600 hover:text-white hover:bg-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50"
                  title="Upload file"
                >
                  {isUploading ? (
                    <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </button>
                {file && <span className="text-xs text-green-600">{file.name}</span>}
              </div>
            )}

            {task.status === "blocked" && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                Blocked
              </Badge>
            )}

            {task.status === "completed" && <Badge className="bg-green-100 text-green-700">Done</Badge>}
            
            {/* Edit button - show if we have the required props */}
            {coachId && programId && milestoneId && (
              <button
                onClick={handleEdit}
                className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-200 rounded-lg shadow-sm transition-all duration-200"
                title="Edit task"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            
            {/* Delete button - always show if we have the required props */}
            {coachId && programId && milestoneId && onDelete && (
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
