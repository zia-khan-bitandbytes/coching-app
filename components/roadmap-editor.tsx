"use client"

import { useState, useEffect } from "react"
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
import { toast } from "@/hooks/use-toast"
import { ChevronDown, ChevronRight, Edit, GripVertical, Plus, Trash2, X } from "lucide-react"
import { TaskCreationDialog } from "@/components/task-creation-dialog"
import { MilestoneCard } from "@/components/milestone-card"
import { Task, Milestone } from "@/lib/types"

interface Program {
  id: number
  name: string
  description: string
  price: number
  duration_weeks: number
  is_active: boolean
}

interface MilestoneWithStats extends Milestone {
  order_index: number
  program_id: number
  completed_count?: number
  total_enrolled?: number
  completion_rate?: number
}

interface ProgramWithMilestones extends Program {
  milestones: MilestoneWithStats[]
  isAddingMilestone: boolean
  newMilestoneForm: {
    title: string
    description: string
  }
}

interface RoadmapEditorProps {
  coachId?: string
}

export function RoadmapEditor({ coachId }: RoadmapEditorProps = {}) {
  const [programs, setPrograms] = useState<ProgramWithMilestones[]>([])
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set())
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set())
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<MilestoneWithStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Form states
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_weeks: ''
  })

  useEffect(() => {
    if (coachId) {
      fetchPrograms()
    }
  }, [coachId])

  const fetchPrograms = async () => {
    if (!coachId) return
    
    try {
      const response = await fetch(`/api/coach/${coachId}/programs`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Initialize programs with empty milestones and form state
          const programsWithMilestones = data.programs.map((program: Program) => ({
            ...program,
            milestones: [],
            isAddingMilestone: false,
            newMilestoneForm: {
              title: '',
              description: ''
            }
          }))
          
          setPrograms(programsWithMilestones)
          
          // Expand first program by default
          if (programsWithMilestones.length > 0) {
            setExpandedPrograms(new Set([programsWithMilestones[0].id]))
            // Fetch milestones for the first program
            await fetchMilestones(programsWithMilestones[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast({
        title: "Error",
        description: "Failed to fetch programs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMilestones = async (programId: number) => {
    if (!coachId) return
    
    try {
      console.log(`Fetching milestones for program ${programId}`)
      const response = await fetch(`/api/coach/${coachId}/programs/${programId}/milestones`)
      if (response.ok) {
        const data = await response.json()
        console.log('Milestones response:', data)
        if (data.success) {
          // Format milestones to match MilestoneCard interface
          const formattedMilestones = data.milestones.map((milestone: any) => ({
            ...milestone,
            status: milestone.completed_count && milestone.total_enrolled && 
                   milestone.completed_count === milestone.total_enrolled ? "completed" :
                   milestone.completed_count > 0 ? "in-progress" : "blocked",
            tasks: milestone.tasks || []
          }))
          
          setPrograms(prev => prev.map(program => 
            program.id === programId 
              ? { ...program, milestones: formattedMilestones }
              : program
          ))
        }
      } else {
        console.error('Failed to fetch milestones:', response.status)
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
    }
  }

  const toggleProgramExpansion = async (programId: number) => {
    const newExpanded = new Set(expandedPrograms)
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId)
    } else {
      newExpanded.add(programId)
      // Fetch milestones when expanding
      await fetchMilestones(programId)
    }
    setExpandedPrograms(newExpanded)
  }

  const toggleMilestoneExpansion = (milestoneId: number) => {
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

  const handleAddProgram = async () => {
    // Validate required fields
    if (!programForm.name.trim() || !programForm.description.trim() || !programForm.price || !programForm.duration_weeks) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/coach/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: programForm.name.trim(),
          description: programForm.description.trim(),
          price: parseFloat(programForm.price),
          duration_weeks: parseInt(programForm.duration_weeks)
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: "Success",
            description: "Program created successfully"
          })
          setIsAddProgramOpen(false)
          setProgramForm({ name: '', description: '', price: '', duration_weeks: '' })
          fetchPrograms()
        }
      }
    } catch (error) {
      console.error('Error creating program:', error)
      toast({
        title: "Error",
        description: "Failed to create program",
        variant: "destructive"
      })
    }
  }

  const toggleMilestoneForm = (programId: number) => {
    setPrograms(prev => prev.map(program => 
      program.id === programId 
        ? { 
            ...program, 
            isAddingMilestone: !program.isAddingMilestone,
            newMilestoneForm: {
              title: '',
              description: ''
            }
          }
        : program
    ))
  }

  const updateMilestoneForm = (programId: number, field: keyof typeof programs[0]['newMilestoneForm'], value: string) => {
    setPrograms(prev => prev.map(program => 
      program.id === programId 
        ? { 
            ...program, 
            newMilestoneForm: {
              ...program.newMilestoneForm,
              [field]: value
            }
          }
        : program
    ))
  }

  const handleAddMilestone = async (programId: number) => {
    const program = programs.find(p => p.id === programId)
    if (!program) return

    const { title, description } = program.newMilestoneForm
    
    console.log('Adding milestone:', { programId, title, description })
    console.log('Timestamp:', new Date().toISOString())

    // Validate required fields
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('Sending POST request to create milestone')
      const response = await fetch(`/api/coach/1/programs/${programId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim()
        })
      })

      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Milestone creation response:', data)
        if (data.success) {
          toast({
            title: "Success",
            description: "Milestone created successfully"
          })
          
          // Reset form and close it
          setPrograms(prev => prev.map(p => 
            p.id === programId 
              ? { 
                  ...p, 
                  isAddingMilestone: false,
                  newMilestoneForm: { title: '', description: '' }
                }
              : p
          ))
          
          // Refresh milestones for this program
          console.log('Refreshing milestones after creation')
          await fetchMilestones(programId)
        }
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to create milestone",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating milestone:', error)
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProgram = async (programId: number) => {
    if (!confirm('Are you sure you want to delete this program? This will also delete all associated milestones.')) {
      return
    }

    try {
      const response = await fetch(`/api/coach/programs/${programId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Program deleted successfully"
        })
        fetchPrograms()
      }
    } catch (error) {
      console.error('Error deleting program:', error)
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMilestone = async (programId: number, milestoneId: number) => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return
    }

    try {
      const response = await fetch(`/api/coach/1/programs/${programId}/milestones?milestoneId=${milestoneId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Milestone deleted successfully"
        })
        await fetchMilestones(programId)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete milestone",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting milestone:', error)
      toast({
        title: "Error",
        description: "Failed to delete milestone",
        variant: "destructive"
      })
    }
  }

  const handleTaskCreated = (milestoneId: number, newTask: any) => {
    // Update the milestone to include the new task
    setPrograms(prev => prev.map(program => ({
      ...program,
      milestones: program.milestones.map(milestone => 
        milestone.id === milestoneId 
          ? { ...milestone, tasks: [...(milestone.tasks || []), newTask] }
          : milestone
      )
    })))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roadmap Editor</h1>
          <p className="text-gray-600 mt-1">Create and manage coaching programs and milestones</p>
        </div>
        <Dialog open={isAddProgramOpen} onOpenChange={setIsAddProgramOpen}>
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
              <div className="space-y-2">
                <label htmlFor="programName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Program Name</label>
                <Input 
                  id="programName" 
                  placeholder="Enter program name"
                  value={programForm.name}
                  onChange={(e) => setProgramForm({...programForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="programDescription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                <Textarea 
                  id="programDescription" 
                  placeholder="Enter program description"
                  value={programForm.description}
                  onChange={(e) => setProgramForm({...programForm, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="programPrice" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Price ($)</label>
                  <Input 
                    id="programPrice" 
                    type="number" 
                    placeholder="0.00"
                    value={programForm.price}
                    onChange={(e) => setProgramForm({...programForm, price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="programDuration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Duration (weeks)</label>
                  <Input 
                    id="programDuration" 
                    type="number" 
                    placeholder="12"
                    value={programForm.duration_weeks}
                    onChange={(e) => setProgramForm({...programForm, duration_weeks: e.target.value})}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleAddProgram}>Add Program</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Programs and Milestones */}
      <div className="space-y-4">
        {programs.map((program) => (
          <Card key={program.id} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleProgramExpansion(program.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedPrograms.has(program.id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">${program.price}</Badge>
                  <Badge variant="secondary">{program.duration_weeks} weeks</Badge>
                  <Badge variant="outline">{program.milestones.length} milestones</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingProgram(program)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProgram(program.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedPrograms.has(program.id) && (
              <CardContent className="pt-0">
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Milestones</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log('Test button clicked for program:', program.id)
                          alert(`Test button clicked for program ${program.id}`)
                        }}
                      >
                        Test
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleMilestoneForm(program.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Milestone
                      </Button>
                    </div>
                  </div>

                  {/* Inline Milestone Form */}
                  {program.isAddingMilestone && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">New Milestone</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMilestoneForm(program.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Title</label>
                          <Input 
                            placeholder="Enter milestone title"
                            value={program.newMilestoneForm.title}
                            onChange={(e) => updateMilestoneForm(program.id, 'title', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <Textarea 
                            placeholder="Enter milestone description"
                            value={program.newMilestoneForm.description}
                            onChange={(e) => updateMilestoneForm(program.id, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => handleAddMilestone(program.id)}
                          className="flex-1"
                        >
                          Add Milestone
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => toggleMilestoneForm(program.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Milestones List */}
                  <div className="space-y-4">
                    {program.milestones
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((milestone) => (
                        <div key={milestone.id} className="relative">
                          <div className="absolute left-4 top-6 flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold z-10">
                            {milestone.order_index}
                          </div>
                          <div className="ml-16">
                            <MilestoneCard
                              milestone={milestone}
                              isExpanded={expandedMilestones.has(milestone.id)}
                              onToggle={() => toggleMilestoneExpansion(milestone.id)}
                              onDelete={(milestoneId) => handleDeleteMilestone(program.id, milestoneId)}
                              onEdit={(milestoneId, newTitle, newDescription) => {
                                // Handle edit here if needed
                                console.log('Edit milestone:', milestoneId, newTitle, newDescription)
                              }}
                              coachId={coachId}
                              programId={program.id.toString()}
                            />
                          </div>
                        </div>
                      ))}
                    
                    {program.milestones.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No milestones yet. Click "Add Milestone" to create the first one.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {programs.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">No programs yet</p>
                <p className="mb-4">Create your first coaching program to get started</p>
                <Button onClick={() => setIsAddProgramOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Program
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
