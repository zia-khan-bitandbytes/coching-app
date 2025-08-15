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
      console.log('Programs response:', programsData)
      if (programsData.success) {
        const programsWithMilestones = programsData.programs.map((program: any) => ({
          ...program,
          milestones: [],
          milestones_count: 0
        }))
        setPrograms(programsWithMilestones)
        
        // Fetch milestones for each program
        for (const program of programsWithMilestones) {
          try {
            const milestonesRes = await fetch(`/api/coach/${coachId}/programs/${program.id}/milestones`)
            const milestonesData = await milestonesRes.json()
            console.log(`Milestones for program ${program.id}:`, milestonesData)
            if (milestonesData.success) {
              // Fetch tasks for each milestone
              const milestonesWithTasks = await Promise.all(
                milestonesData.milestones.map(async (milestone: any) => {
                  try {
                    const tasksRes = await fetch(`/api/coach/${coachId}/programs/${program.id}/milestones/${milestone.id}/tasks`)
                    if (tasksRes.ok) {
                      const tasksData = await tasksRes.json()
                      if (tasksData.success) {
                        return {
                          ...milestone,
                          program_id: program.id,
                          program_name: program.name,
                          tasks: tasksData.tasks
                        }
                      }
                    }
                    return {
                      ...milestone,
                      program_id: program.id,
                      program_name: program.name,
                      tasks: []
                    }
                  } catch (error) {
                    console.error(`Error fetching tasks for milestone ${milestone.id}:`, error)
                    return {
                      ...milestone,
                      program_id: program.id,
                      program_name: program.name,
                      tasks: []
                    }
                  }
                })
              )
              
              setPrograms(prev => prev.map(p => 
                p.id === program.id 
                  ? { ...p, milestones: milestonesWithTasks, milestones_count: milestonesWithTasks.length }
                  : p
              ))
              
              setMilestones(prev => [...prev.filter(m => m.program_id !== program.id), ...milestonesWithTasks])
            }
          } catch (error) {
            console.error(`Error fetching milestones for program ${program.id}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching coach data:', error)
    }
  }

  const handleAddProgram = async () => {
    if (!coachId) return
    
    try {
      const response = await fetch('/api/coach/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProgram, coach_id: coachId })
      })
      
      if (response.ok) {
        setAddProgramOpen(false)
        setNewProgram({ name: '', description: '', duration_weeks: 4, price: 0 })
        fetchCoachData() // Refresh data
        toast({
          title: "Program created",
          description: `"${newProgram.name}" has been successfully created.`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Error adding program:', error)
      toast({
        title: "Error",
        description: "Failed to create program. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddMilestone = async () => {
    if (!coachId) return
    
    try {
      if (!newMilestone.program_id) {
        console.error('No program selected for milestone')
        return
      }

      const response = await fetch(`/api/coach/${coachId}/programs/${newMilestone.program_id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMilestone.title,
          description: newMilestone.description
        })
      })
      
      if (response.ok) {
        setAddMilestoneOpen(false)
        setNewMilestone({ title: '', description: '', program_id: '' })
        fetchCoachData() // Refresh data
        toast({
          title: "Milestone created",
          description: `"${newMilestone.title}" has been successfully created.`,
          variant: "default",
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to create milestone:', errorData)
        toast({
          title: "Error",
          description: "Failed to create milestone. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding milestone:', error)
      toast({
        title: "Error",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMilestone = async (milestoneId: string, programId: string) => {
    if (!coachId) return
    
    try {
      const response = await fetch(`/api/coach/${coachId}/programs/${programId}/milestones?milestoneId=${milestoneId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchCoachData() // Refresh data
        toast({
          title: "Milestone deleted",
          description: "Milestone has been successfully deleted.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Error deleting milestone:', error)
      toast({
        title: "Error",
        description: "Failed to delete milestone. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTaskCreated = (milestoneId: number, newTaskData: any) => {
    // Refresh data to show the new task
    fetchCoachData()
  }

  const handleTaskUpdated = (milestoneId: number, taskId: number, updatedTask: any) => {
    // Refresh data to show the updated task
    fetchCoachData()
  }

  const handleTaskDeleted = (milestoneId: number, taskId: number) => {
    // Refresh data to show the deleted task
    fetchCoachData()
  }

  const handleEditTask = (milestoneId: string, taskId: string, task: Task) => {
    // Open edit task dialog and populate form
    setEditingTask({ milestoneId, taskId, task })
    setEditTaskData({
      title: task.title,
      description: task.description || '',
      requiresUpload: (task as any).requiresUpload || false
    })
    setEditTaskOpen(true)
  }

  const handleDeleteTask = async (milestoneId: string, taskId: string, taskTitle: string) => {
    if (!coachId) return
    
    if (!confirm(`Are you sure you want to delete the task "${taskTitle}"?`)) {
      return
    }

    try {
      // Find the program ID for this milestone
      const program = programs.find(p => p.milestones?.some(m => m.id === milestoneId))
      if (!program) {
        toast({
          title: "Error",
          description: "Could not find the program for this milestone.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/coach/${coachId}/programs/${program.id}/milestones/${milestoneId}/tasks?taskId=${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Task deleted",
          description: `"${taskTitle}" has been successfully deleted.`,
          variant: "default",
        })
        fetchCoachData() // Refresh data
      } else {
        const errorData = await response.json()
        console.error('Failed to delete task:', errorData)
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
    }
  }

  const handleSaveTaskEdit = async () => {
    if (!editingTask || !coachId) return

    try {
      // Find the program ID for this milestone
      const program = programs.find(p => p.milestones?.some(m => m.id === editingTask.milestoneId))
      if (!program) {
        toast({
          title: "Error",
          description: "Could not find the program for this milestone.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/coach/${coachId}/programs/${program.id}/milestones/${editingTask.milestoneId}/tasks?taskId=${editingTask.taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTaskData.title,
          description: editTaskData.description,
          requiresUpload: editTaskData.requiresUpload
        })
      })

      if (response.ok) {
        toast({
          title: "Task updated",
          description: `"${editTaskData.title}" has been successfully updated.`,
          variant: "default",
        })
        setEditTaskOpen(false)
        setEditingTask(null)
        setEditTaskData({ title: '', description: '', requiresUpload: false })
        fetchCoachData() // Refresh data
      } else {
        const errorData = await response.json()
        console.error('Failed to update task:', errorData)
        toast({
          title: "Error",
          description: "Failed to update task. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProgram = async (programId: string, programName: string) => {
    const program = programs.find(p => p.id === programId)
    if (!program) return
    
    setDeleteProgramDialog({ open: true, program })
  }

  const confirmDeleteProgram = async () => {
    const program = deleteProgramDialog.program
    if (!program || !coachId) return
    
    try {
      setDeletingPrograms(prev => new Set(prev).add(program.id))
      
      const response = await fetch(`/api/coach/${coachId}/programs/${program.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Program deleted",
          description: `"${program.name}" has been successfully deleted along with all associated data.`,
          variant: "default",
        })
        setDeleteProgramDialog({ open: false, program: null })
        fetchCoachData() // Refresh data
      } else {
        const errorData = await response.json()
        console.error('Failed to delete program:', errorData)
        toast({
          title: "Error",
          description: "Failed to delete program. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting program:', error)
      toast({
        title: "Error",
        description: "Failed to delete program. Please try again.",
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

  const openAddMilestoneDialog = (programId: string) => {
    setNewMilestone({ ...newMilestone, program_id: programId })
    setAddMilestoneOpen(true)
  }

  if (!coachId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roadmap Editor</h1>
            <p className="text-gray-600 mt-1">Create and manage coaching programs and milestones</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Coach ID not found. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roadmap Editor</h1>
          <p className="text-gray-600 mt-1">Create and manage coaching programs and milestones</p>
        </div>
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
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  placeholder="Enter program name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  placeholder="Enter program description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newProgram.duration_weeks}
                    onChange={(e) => setNewProgram({ ...newProgram, duration_weeks: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProgram.price}
                    onChange={(e) => setNewProgram({ ...newProgram, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddProgram}>Add Program</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {programs.map((program) => (
          <Card key={program.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleProgramExpansion(program.id)}
                    className="p-1 h-8 w-8"
                  >
                    {expandedPrograms.has(program.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <CardDescription className="text-sm">{program.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={program.is_active ? "default" : "secondary"}>
                    {program.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => openAddMilestoneDialog(program.id)}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Milestone
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteProgram(program.id, program.name)}
                    className="h-8 text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                    title={`Delete "${program.name}" and all associated data (${program.milestones_count || 0} milestones, ${program.members_count || 0} members)`}
                    disabled={deletingPrograms.has(program.id)}
                  >
                    {deletingPrograms.has(program.id) ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 ml-11">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{program.duration_weeks} weeks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${program.price}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{program.members_count || 0} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>{program.milestones_count || 0} milestones</span>
                </div>
              </div>
            </CardHeader>

            {expandedPrograms.has(program.id) && (
              <CardContent className="pt-0">
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Milestones</h4>
                    <span className="text-sm text-gray-500">
                      {program.milestones?.length || 0} total
                    </span>
                  </div>
                  
                  {program.milestones && program.milestones.length > 0 ? (
                    <div className="space-y-3">
                      {program.milestones
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((milestone) => (
                          <div key={milestone.id} className="bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleMilestoneExpansion(milestone.id)}
                                  className="p-1 h-6 w-6"
                                >
                                  {expandedMilestones.has(milestone.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div className="w-8 h-8 rounded-full bg-black text-white text-sm flex items-center justify-center font-medium">
                                  {milestone.order_index}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{milestone.title}</div>
                                  <div className="text-sm text-gray-600">{milestone.description}</div>
                                  {milestone.completion_rate !== undefined && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Completion: {milestone.completion_rate}% 
                                      ({milestone.completed_count || 0}/{milestone.total_enrolled || 0})
                                    </div>
                                  )}
                                  {milestone.tasks && milestone.tasks.length > 0 && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      {milestone.tasks.length} task{milestone.tasks.length !== 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMilestone(milestone)}
                                  className="h-8 text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <TaskCreationDialog
                                  milestoneId={parseInt(milestone.id)}
                                  milestoneTitle={milestone.title}
                                  coachId={coachId}
                                  programId={program.id}
                                  onTaskCreated={(newTask) => handleTaskCreated(parseInt(milestone.id), newTask)}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteMilestone(milestone.id, program.id)}
                                  className="h-8 text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            
                            {/* Tasks Section */}
                            {expandedMilestones.has(milestone.id) && milestone.tasks && milestone.tasks.length > 0 && (
                              <div className="border-t border-gray-200 px-3 pb-3">
                                <div className="mt-2 space-y-1">
                                  {milestone.tasks
                                    .sort((a, b) => a.order_index - b.order_index)
                                    .map((task) => (
                                      <div key={task.id} className="flex items-center gap-2 p-2 bg-white rounded text-sm">
                                        <div className="flex items-center justify-center w-5 h-5 bg-gray-100 text-gray-600 rounded text-xs">
                                          {task.order_index}
                                        </div>
                                        <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                          {task.title}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {task.completed ? (
                                            <Badge variant="secondary" className="text-xs">Completed</Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-xs">Pending</Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditTask(milestone.id, task.id, task)}
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                            title="Edit task"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteTask(milestone.id, task.id, task.title)}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                            title="Delete task"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No milestones yet</p>
                      <p className="text-sm">Click "Add Milestone" to create the first milestone for this program</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Add Milestone Dialog */}
      <Dialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Milestone</DialogTitle>
            <DialogDescription>Add a milestone to the selected program</DialogDescription>
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
          </div>
          <DialogFooter>
            <Button onClick={handleAddMilestone}>Add Milestone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Program Confirmation Dialog */}
      <Dialog open={deleteProgramDialog.open} onOpenChange={(open) => setDeleteProgramDialog({ open, program: deleteProgramDialog.program })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <DialogTitle className="text-red-600">Delete Program</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete this program? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteProgramDialog.program && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">{deleteProgramDialog.program.name}</h4>
                <p className="text-sm text-red-700 mb-3">{deleteProgramDialog.program.description}</p>
                
                <div className="text-sm text-red-600 space-y-1">
                  <p>This will permanently delete:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>{deleteProgramDialog.program.milestones_count || 0} milestone(s)</li>
                    <li>{deleteProgramDialog.program.members_count || 0} enrolled member(s)</li>
                    <li>All progress data and enrollments</li>
                    <li>Payment records</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteProgramDialog({ open: false, program: null })}
              disabled={deletingPrograms.has(deleteProgramDialog.program?.id || '')}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteProgram}
              disabled={deletingPrograms.has(deleteProgramDialog.program?.id || '')}
            >
              {deletingPrograms.has(deleteProgramDialog.program?.id || '') ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Program'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-task-title">Title</Label>
              <Input
                id="edit-task-title"
                value={editTaskData.title}
                onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                value={editTaskData.description}
                onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-task-requires-upload"
                checked={editTaskData.requiresUpload}
                onChange={(e) => setEditTaskData({ ...editTaskData, requiresUpload: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-task-requires-upload">Requires file upload</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTaskEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 