"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Lock, ChevronRight, ArrowUp } from "lucide-react"

interface Task {
  id: number
  title: string
  status: "completed" | "in-progress" | "blocked"
  requiresUpload?: boolean
}

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in-progress":
        return <ChevronRight className="h-4 w-4 text-blue-600" />
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
      </div>
    </div>
  )
}
