"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Lock, ArrowUp, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Task {
  id: number
  title: string
  status: "completed" | "in-progress" | "blocked"
  requiresUpload?: boolean
}

interface TaskItemProps {
  task: Task
  onDelete?: (taskId: number) => void
  coachId?: string
  programId?: string
  milestoneId?: number
}

export function TaskItem({ task, onDelete, coachId, programId, milestoneId }: TaskItemProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
      <div className="flex items-center gap-3">
        {getStatusIcon(task.status)}
        <span className={`text-sm ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {task.requiresUpload && task.status === "in-progress" && (
          <div className="flex items-center gap-2">
            <Input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id={`file-${task.id}`}
              accept=".pdf,.doc,.docx,.txt"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`file-${task.id}`)?.click()}
              disabled={isUploading}
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            {file && <span className="text-xs text-green-600">{file.name}</span>}
          </div>
        )}

        {task.status === "blocked" && (
          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            Blocked
          </Badge>
        )}

        {task.status === "completed" && <Badge className="bg-green-100 text-green-700">Done</Badge>}
        
        {/* Delete button - always show if we have the required props */}
        {coachId && programId && milestoneId && onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200 rounded-lg shadow-sm transition-all duration-200 group disabled:opacity-50"
            title="Delete task"
          >
            {isDeleting ? (
              <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
