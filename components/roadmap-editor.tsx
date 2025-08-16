"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Target, Calendar, Plus, ChevronDown, ChevronRight, Edit, Trash2, AlertTriangle, DollarSign, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TaskCreationDialog } from "@/components/task-creation-dialog"

interface Program {
  id: string
  name: string
  description: string
  duration_weeks: number
  price: number
  is_active: boolean
  created_at: string
  milestones_count: number
  members_count: number
  milestones?: Milestone[]
}

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  order_index: number
  milestone_id: string
  created_at: string
  completed_at?: string
}

interface Milestone {
  id: string
  title: string
  description: string
  order_index: number
  program_id: string
  program_name: string
  created_at: string
  completed_count?: number
  total_enrolled?: number
  completion_rate?: number
  tasks?: Task[]
}

interface RoadmapEditorProps {
  coachId?: string
}

export function RoadmapEditor({ coachId }: RoadmapEditorProps = {}) {
  const { toast } = useToast()
  const [programs, setPrograms] = useState<Program[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])

  // Form states
  const [addProgramOpen, setAddProgramOpen] = useState(false)
  const [newProgram, setNewProgram] = useState({ name: '', description: '', duration_weeks: 4, price: 0 })
  
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', program_id: '' })

  // Task editing states
  const [editTaskOpen, setEditTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<{ milestoneId: string; taskId: string; task: Task } | null>(null)
  const [editTaskData, setEditTaskData] = useState({ title: '', description: '', requiresUpload: false })

  // UI states
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set())
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [deletingPrograms, setDeletingPrograms] = useState<Set<string>>(new Set())
  const [deleteProgramDialog, setDeleteProgramDialog] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null })

  useEffect(() => {
    if (coachId) {
      fetchCoachData()
    }
  }, [coachId])

  const fetchCoachData = async () => {
    if (!coachId) return
    
    try {
      // Fetch programs
      const programsRes = await fetch(`/api/coach/${coachId}/programs`)
      const programsData = await programsRes.json()
      
      if (programsData.success) {
        setPrograms(programsData.programs)
      } else {
        console.error('Failed to fetch programs:', programsData.error)
        toast({
          title: "Error",
          description: "Failed to fetch programs",
          variant: "destructive",
        })
      }

      // Fetch milestones
      const milestonesRes = await fetch(`/api/coach/${coachId}/milestones`)
      const milestonesData = await milestonesRes.json()
      
      if (milestonesData.success) {
        setMilestones(milestonesData.milestones)
      } else {
        console.error('Failed to fetch milestones:', milestonesData.error)
        toast({
          title: "Error",
          description: "Failed to fetch milestones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching coach data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch coach data",
        variant: "destructive",
      })
    }
  }

  const handleAddProgram = async () => {
    if (!newProgram.name || !newProgram.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/coach/${coachId}/programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProgram),
      })

      const data = await response.json()

      if (data.success) {
        setPrograms([...programs, data.program])
        setNewProgram({ name: '', description: '', duration_weeks: 4, price: 0 })
        setAddProgramOpen(false)
        toast({
          title: "Success",
          description: "Program created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create program",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating program:', error)
      toast({
        title: "Error",
        description: "Failed to create program",
        variant: "destructive",
      })
    }
  }

  const handleAddMilestone = async () => {
    if (!newMilestone.title || !newMilestone.description || !newMilestone.program_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/coach/${coachId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMilestone),
      })

      const data = await response.json()

      if (data.success) {
        setMilestones([...milestones, data.milestone])
        setNewMilestone({ title: '', description: '', program_id: '' })
        setAddMilestoneOpen(false)
        toast({
          title: "Success",
          description: "Milestone created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create milestone",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating milestone:', error)
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProgram = async (program: Program) => {
    try {
      setDeletingPrograms(prev => new Set(prev).add(program.id))
      
      const response = await fetch(`/api/coach/${coachId}/programs/${program.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setPrograms(programs.filter(p => p.id !== program.id))
        setMilestones(milestones.filter(m => m.program_id !== program.id))
        toast({
          title: "Success",
          description: "Program deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete program",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting program:', error)
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive",
      })
    } finally {
      setDeletingPrograms(prev => {
        const newSet = new Set(prev)
        newSet.delete(program.id)
        return newSet
      })
    }
  }

  const toggleProgramExpansion = (programId: string) => {
    setExpandedPrograms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(programId)) {
        newSet.delete(programId)
      } else {
        newSet.add(programId)
      }
      return newSet
    })
  }

  const toggleMilestoneExpansion = (milestoneId: string) => {
    setExpandedMilestones(prev => {
      const newSet = new Set(prev)
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId)
      } else {
        newSet.add(milestoneId)
      }
      return newSet
    })
  }

  const getProgramMilestones = (programId: string) => {
    return milestones.filter(m => m.program_id === programId)
  }

  const getMilestoneTasks = (milestoneId: string) => {
    // This would be fetched from the API in a real implementation
    return []
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roadmap Editor</h1>
          <p className="text-gray-600 mt-1">Create and manage coaching programs and milestones</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Milestone</DialogTitle>
                <DialogDescription>Create a new milestone for your coaching program</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="milestone-title">Title</Label>
                  <Input
                    id="milestone-title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    placeholder="Enter milestone title"
                  />
                </div>
                <div>
                  <Label htmlFor="milestone-description">Description</Label>
                  <Textarea
                    id="milestone-description"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="Enter milestone description"
                  />
                </div>
                <div>
                  <Label htmlFor="milestone-program">Program</Label>
                  <Select value={newMilestone.program_id} onValueChange={(value) => setNewMilestone({ ...newMilestone, program_id: value })}>
                    <SelectTrigger id="milestone-program">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddMilestoneOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMilestone}>
                  Create Milestone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addProgramOpen} onOpenChange={setAddProgramOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Program</DialogTitle>
                <DialogDescription>Create a new coaching program</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="program-name">Program Name</Label>
                  <Input
                    id="program-name"
                    value={newProgram.name}
                    onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                    placeholder="Enter program name"
                  />
                </div>
                <div>
                  <Label htmlFor="program-description">Description</Label>
                  <Textarea
                    id="program-description"
                    value={newProgram.description}
                    onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                    placeholder="Enter program description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="program-duration">Duration (weeks)</Label>
                    <Input
                      id="program-duration"
                      type="number"
                      value={newProgram.duration_weeks}
                      onChange={(e) => setNewProgram({ ...newProgram, duration_weeks: parseInt(e.target.value) || 4 })}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="program-price">Price ($)</Label>
                    <Input
                      id="program-price"
                      type="number"
                      value={newProgram.price}
                      onChange={(e) => setNewProgram({ ...newProgram, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddProgramOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProgram}>
                  Create Program
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {programs.length > 0 ? (
          programs.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProgramExpansion(program.id)}
                    >
                      {expandedPrograms.has(program.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <CardDescription>{program.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={program.is_active ? "default" : "secondary"}>
                      {program.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{program.duration_weeks} weeks</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <DollarSign className="h-4 w-4" />
                      <span>${program.price}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{program.members_count} members</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteProgramDialog({ open: true, program })}
                      disabled={deletingPrograms.has(program.id)}
                    >
                      {deletingPrograms.has(program.id) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedPrograms.has(program.id) && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Milestones ({getProgramMilestones(program.id).length})</h4>
                    </div>
                    
                    {getProgramMilestones(program.id).length > 0 ? (
                      <div className="space-y-3">
                        {getProgramMilestones(program.id).map((milestone) => (
                          <div key={milestone.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMilestoneExpansion(milestone.id)}
                                >
                                  {expandedMilestones.has(milestone.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div>
                                  <h5 className="font-medium">{milestone.title}</h5>
                                  <p className="text-sm text-gray-600">{milestone.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">
                                  Order: {milestone.order_index}
                                </Badge>
                                {milestone.completion_rate !== undefined && (
                                  <Badge variant="secondary">
                                    {milestone.completion_rate}% complete
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {expandedMilestones.has(milestone.id) && (
                              <div className="mt-4 pl-8">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="font-medium text-sm">Tasks</h6>
                                  <TaskCreationDialog milestoneId={milestone.id} />
                                </div>
                                <div className="text-sm text-gray-500">
                                  Task management will be implemented here
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Target className="h-8 w-8 mx-auto mb-2" />
                        <p>No milestones yet</p>
                        <p className="text-sm">Create milestones to structure your program</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No programs yet</h3>
              <p className="text-gray-600 mb-4">Create your first coaching program to get started</p>
              <Button onClick={() => setAddProgramOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Program
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Program Confirmation Dialog */}
      <Dialog open={deleteProgramDialog.open} onOpenChange={(open) => setDeleteProgramDialog({ open, program: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteProgramDialog.program?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProgramDialog({ open: false, program: null })}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (deleteProgramDialog.program) {
                  handleDeleteProgram(deleteProgramDialog.program)
                  setDeleteProgramDialog({ open: false, program: null })
                }
              }}
            >
              Delete Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 