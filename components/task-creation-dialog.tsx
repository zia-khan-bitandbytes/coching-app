"use client"

import React, { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2, Upload, File, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TaskCreationDialogProps {
  milestoneId: number
  milestoneTitle: string
  coachId: string
  programId: string
  onTaskCreated: (newTask: any) => void
}

interface UploadedFile {
  name: string
  size: number
  type: string
  url?: string
}

export function TaskCreationDialog({
  milestoneId,
  milestoneTitle,
  coachId,
  programId,
  onTaskCreated,
}: TaskCreationDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requiresUpload, setRequiresUpload] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    
    try {
      const newFiles: UploadedFile[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('milestoneId', milestoneId.toString())
        formData.append('coachId', coachId)
        formData.append('programId', programId)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Upload response data:', data)
          console.log('File URL from response:', data.file?.url)
          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: data.file?.url
          })
        } else {
          toast({
            title: "Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          })
        }
      }
      
      setUploadedFiles(prev => [...prev, ...newFiles])
      
      if (newFiles.length > 0) {
        toast({
          title: "Success",
          description: `${newFiles.length} file(s) uploaded successfully`
        })
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log('Sending uploaded files:', uploadedFiles)
      console.log('Uploaded files with URLs:', uploadedFiles.map(f => ({ name: f.name, url: f.url })))
      
      const response = await fetch(
        `/api/coach/${coachId}/programs/${programId}/milestones/${milestoneId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            requiresUpload: requiresUpload,
            uploadedFiles: uploadedFiles
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        console.log('Task created successfully:', data.task)
        toast({
          title: "Success",
          description: "Task created successfully",
        })
        
        // Call the callback to refresh the task list
        onTaskCreated(data.task)
        
        // Reset form and close dialog
        setTitle("")
        setDescription("")
        setRequiresUpload(false)
        setUploadedFiles([])
        setOpen(false)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create task",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setTitle("")
    setDescription("")
    setRequiresUpload(false)
    setUploadedFiles([])
    setOpen(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="px-3 py-2 text-green-600 bg-green-50 border border-green-200 hover:text-green-700 hover:bg-green-100 hover:border-green-300 rounded-lg shadow-sm flex items-center gap-1"
          title="Add task"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Add a new task to milestone: <strong>{milestoneTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter task description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>
            
            {/* File Upload Section */}
            <div className="space-y-3">
              <Label>Upload Files (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading || isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Uploading..." : "Choose Files"}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Click to upload files or drag and drop
                </p>
              </div>
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Files:</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresUpload"
                checked={requiresUpload}
                onCheckedChange={(checked) => setRequiresUpload(checked as boolean)}
                disabled={isLoading}
              />
              <Label
                htmlFor="requiresUpload"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Upload require
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}