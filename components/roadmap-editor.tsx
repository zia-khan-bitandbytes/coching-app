"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, GripVertical } from "lucide-react"

const programs = [
  { id: "business-growth", name: "Business Growth Program" },
  { id: "leadership", name: "Leadership Mastery" },
  { id: "sales-excellence", name: "Sales Excellence" },
]

const milestones = [
  {
    id: 1,
    title: "Foundation Setup",
    description: "Initial assessment and goal setting",
    order: 1,
    program: "business-growth",
    tasks: [
      { id: 1, title: "Complete onboarding", requiresUpload: false },
      { id: 2, title: "Initial consultation", requiresUpload: false },
      { id: 3, title: "Upload business plan", requiresUpload: true },
    ],
  },
  {
    id: 2,
    title: "Strategy Development",
    description: "Create comprehensive business strategy",
    order: 2,
    program: "business-growth",
    tasks: [
      { id: 4, title: "Market analysis", requiresUpload: false },
      { id: 5, title: "Submit strategy document", requiresUpload: true },
    ],
  },
]

export function RoadmapEditor() {
  const [selectedProgram, setSelectedProgram] = useState("business-growth")
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<number | null>(null)

  const filteredMilestones = milestones.filter((m) => m.program === selectedProgram)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roadmap Editor</h1>
          <p className="text-gray-600 mt-1">Create and manage coaching program roadmaps</p>
        </div>
      </div>

      {/* Program Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Program</CardTitle>
          <CardDescription>Choose which coaching program to edit</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>Manage milestones for the selected program</CardDescription>
          </div>
          <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Milestone</DialogTitle>
                <DialogDescription>Create a new milestone for the coaching program</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Milestone Title</Label>
                  <Input id="title" placeholder="Enter milestone title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter milestone description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input id="order" type="number" placeholder="1" />
                </div>
                <Button className="w-full">Add Milestone</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMilestones.map((milestone) => (
              <div key={milestone.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    <div>
                      <h3 className="font-medium">{milestone.title}</h3>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                    </div>
                    <Badge variant="outline">Order: {milestone.order}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingMilestone(milestone.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Tasks</h4>
                    <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Task</DialogTitle>
                          <DialogDescription>Add a task to this milestone</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="taskTitle">Task Title</Label>
                            <Input id="taskTitle" placeholder="Enter task title" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="requiresUpload" />
                            <Label htmlFor="requiresUpload">Requires file upload</Label>
                          </div>
                          <Button className="w-full">Add Task</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-2 ml-4">
                    {milestone.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{task.title}</span>
                          {task.requiresUpload && (
                            <Badge variant="secondary" className="text-xs">
                              Upload Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
