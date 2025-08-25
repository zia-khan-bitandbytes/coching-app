"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  is_active: boolean
  calculated_duration?: number // Calculated from milestone goal_days
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
    goal_days: string
  }
}

interface RoadmapEditorProps {
  coachId?: string
}

export function RoadmapEditor({ coachId }: RoadmapEditorProps = {}) {
  console.log('RoadmapEditor received coachId:', coachId)
  const [programs, setPrograms] = useState<ProgramWithMilestones[]>([])
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set())
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set())
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<MilestoneWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const [modalMilestoneForm, setModalMilestoneForm] = useState({
    title: '',
    description: '',
    goal_days: ''
  })
  const [milestoneErrors, setMilestoneErrors] = useState({ title: '', description: '', goal_days: '' })

  // Form states
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    price: ''
  })
  const [programErrors, setProgramErrors] = useState({ name: '', description: '', price: '' })

  // Validation functions
  const validateProgram = () => {
    const errors = { name: '', description: '', price: '' }
    
    // Name validation: 3-50 characters
    if (programForm.name.length < 3) {
      errors.name = 'Program name must be at least 3 characters'
    } else if (programForm.name.length > 50) {
      errors.name = 'Program name must be 50 characters or less'
    }
    
    // Description validation: 10-500 characters
    if (programForm.description.length < 10) {
      errors.description = 'Description must be at least 10 characters'
    } else if (programForm.description.length > 500) {
      errors.description = 'Description must be 500 characters or less'
    }
    
    // Price validation: must be positive number
    const price = parseFloat(programForm.price)
    if (isNaN(price) || price <= 0) {
      errors.price = 'Price must be a positive number'
    }
    
    setProgramErrors(errors)
    return !Object.values(errors).some(error => error !== '')
  }

  const clearProgramErrors = () => {
    setProgramErrors({ name: '', description: '', price: '' })
  }

  const validateMilestone = () => {
    const errors = { title: '', description: '', goal_days: '' }
    
    // Title validation: 3-100 characters
    if (modalMilestoneForm.title.length < 3) {
      errors.title = 'Milestone title must be at least 3 characters'
    } else if (modalMilestoneForm.title.length > 100) {
      errors.title = 'Milestone title must be 100 characters or less'
    }
    
    // Description validation: 10-500 characters
    if (modalMilestoneForm.description.length < 10) {
      errors.description = 'Description must be at least 10 characters'
    } else if (modalMilestoneForm.description.length > 500) {
      errors.description = 'Description must be 500 characters or less'
    }
    
    // Goal days validation: must be positive number
    const goalDays = parseInt(modalMilestoneForm.goal_days)
    if (isNaN(goalDays) || goalDays <= 0) {
      errors.goal_days = 'Goal days must be a positive number'
    }
    
    setMilestoneErrors(errors)
    return !Object.values(errors).some(error => error !== '')
  }

  const clearMilestoneErrors = () => {
    setMilestoneErrors({ title: '', description: '', goal_days: '' })
  }

  const openAddMilestoneModal = (programId: number) => {
    setSelectedProgramId(programId)
    setModalMilestoneForm({ title: '', description: '', goal_days: '' })
    clearMilestoneErrors()
    setIsAddMilestoneModalOpen(true)
  }

  const openAddProgramDialog = () => {
    setProgramForm({ name: '', description: '', price: '' })
    clearProgramErrors()
    setIsAddProgramOpen(true)
  }

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
              description: '',
              goal_days: ''
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
          
          // Calculate total program duration from milestone goal days
          const totalDuration = formattedMilestones.reduce((sum: number, milestone: any) => {
            return sum + (milestone.goal_days || 0)
          }, 0)
          
          setPrograms(prev => prev.map(program => 
            program.id === programId 
              ? { ...program, milestones: formattedMilestones, calculated_duration: totalDuration }
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
    // Validate form before submitting
    if (!validateProgram()) {
      return
    }

    // Ensure we have a coach id
    if (!coachId) {
      toast({
        title: "Error",
        description: "Coach profile not found. Please refresh the page or contact support if the issue persists.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/coach/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: coachId,
          name: programForm.name.trim(),
          description: programForm.description.trim(),
          price: parseFloat(programForm.price)
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
          setProgramForm({ name: '', description: '', price: '' })
          clearProgramErrors()
          fetchPrograms()
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to create program",
            variant: "destructive"
          })
        }
      } else {
        const errorData = await response.json().catch(() => null)
        toast({
          title: "Error",
          description: (errorData && errorData.error) || "Failed to create program",
          variant: "destructive"
        })
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
              description: '',
              goal_days: ''
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

    const { title, description, goal_days } = program.newMilestoneForm
    
    console.log('Adding milestone:', { programId, title, description })
    console.log('Timestamp:', new Date().toISOString())

    // Validate required fields
    if (!title.trim() || !description.trim() || !goal_days.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('Sending POST request to create milestone')
      const response = await fetch(`/api/coach/${coachId}/programs/${programId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          goal_days: parseInt(goal_days)
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
                  newMilestoneForm: { title: '', description: '', goal_days: '' }
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

  const handleModalAddMilestone = async () => {
    if (!selectedProgramId) return

    // Validate form before submitting
    if (!validateMilestone()) {
      return
    }

    const { title, description, goal_days } = modalMilestoneForm

    try {
      const response = await fetch(`/api/coach/${coachId}/programs/${selectedProgramId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          goal_days: parseInt(goal_days)
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: "Success",
            description: "Milestone created successfully"
          })
          
          // Reset modal form and close modal
          setModalMilestoneForm({ title: '', description: '', goal_days: '' })
          clearMilestoneErrors()
          setIsAddMilestoneModalOpen(false)
          setSelectedProgramId(null)
          
          // Refresh milestones for this program
          await fetchMilestones(selectedProgramId)
        }
      } else {
        const errorData = await response.json()
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

  const handleEditProgram = async () => {
    if (!editingProgram || !coachId) {
      toast({
        title: "Error",
        description: "Program data or Coach ID not found. Please reload and try again.",
        variant: "destructive"
      })
      return
    }

    // Validate required fields
    if (!editingProgram.name.trim() || !editingProgram.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/coach/${coachId}/programs/${editingProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProgram.name.trim(),
          description: editingProgram.description.trim(),
          price: editingProgram.price,
          is_active: editingProgram.is_active
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: "Success",
            description: "Program updated successfully"
          })
          setEditingProgram(null)
          fetchPrograms()
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to update program",
            variant: "destructive"
          })
        }
      } else {
        const errorData = await response.json().catch(() => null)
        toast({
          title: "Error",
          description: (errorData && errorData.error) || "Failed to update program",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating program:', error)
      toast({
        title: "Error",
        description: "Failed to update program",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProgram = async (programId: number) => {
    if (!coachId) {
      toast({
        title: "Error",
        description: "Coach ID not found. Please reload and try again.",
        variant: "destructive"
      })
      return
    }

    if (!confirm('Are you sure you want to delete this program? This will also delete all associated milestones.')) {
      return
    }

    try {
      const response = await fetch(`/api/coach/${coachId}/programs/${programId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Program deleted successfully"
        })
        fetchPrograms()
      } else {
        const errorData = await response.json().catch(() => null)
        toast({
          title: "Error",
          description: (errorData && errorData.error) || "Failed to delete program",
          variant: "destructive"
        })
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

  const handleEditMilestone = async (programId: number, milestoneId: number, newTitle: string, newDescription: string) => {
    if (!coachId) {
      toast({
        title: "Error",
        description: "Coach ID not found. Please reload and try again.",
        variant: "destructive"
      })
      return
    }

    // Validate required fields
    if (!newTitle.trim()) {
      toast({
        title: "Error",
        description: "Milestone title is required",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/coach/${coachId}/programs/${programId}/milestones?milestoneId=${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast({
            title: "Success",
            description: "Milestone updated successfully"
          })
          await fetchMilestones(programId)
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to update milestone",
            variant: "destructive"
          })
        }
      } else {
        const errorData = await response.json().catch(() => null)
        toast({
          title: "Error",
          description: (errorData && errorData.error) || "Failed to update milestone",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating milestone:', error)
      toast({
        title: "Error",
        description: "Failed to update milestone",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMilestone = async (programId: number, milestoneId: number) => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return
    }

    try {
      const response = await fetch(`/api/coach/${coachId}/programs/${programId}/milestones?milestoneId=${milestoneId}`, {
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
            <Button onClick={openAddProgramDialog}>
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
                <div className="flex items-center justify-between">
                  <label htmlFor="programName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Program Name</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">3-50 characters</span>
                    {programForm.name.length >= 3 && programForm.name.length <= 50 && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                </div>
                <Input 
                  id="programName" 
                  placeholder="Enter program name"
                  value={programForm.name}
                  onChange={(e) => {
                    setProgramForm({...programForm, name: e.target.value})
                    if (programErrors.name) clearProgramErrors()
                  }}
                  maxLength={50}
                />
                <div className="mt-1">
                  <span className="text-xs text-red-600">{programErrors.name}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="programDescription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">10-500 characters</span>
                    {programForm.description.length >= 10 && programForm.description.length <= 500 && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                </div>
                <Textarea 
                  id="programDescription" 
                  placeholder="Enter program description"
                  value={programForm.description}
                  onChange={(e) => {
                    setProgramForm({...programForm, description: e.target.value})
                    if (programErrors.description) clearProgramErrors()
                  }}
                  maxLength={500}
                  rows={3}
                />
                <div className="mt-1">
                  <span className="text-xs text-red-600">{programErrors.description}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="programPrice" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Price ($)</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Must be greater than $0</span>
                      {parseFloat(programForm.price) > 0 && (
                        <span className="text-green-500">✓</span>
                      )}
                    </div>
                  </div>
                  <Input 
                    id="programPrice" 
                    type="number" 
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    value={programForm.price}
                    onChange={(e) => {
                      setProgramForm({...programForm, price: e.target.value})
                      if (programErrors.price) clearProgramErrors()
                    }}
                  />
                  <div className="mt-1">
                    <span className="text-xs text-red-600">{programErrors.price}</span>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={handleAddProgram}>Add Program</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Program Dialog */}
        <Dialog open={!!editingProgram} onOpenChange={(open) => !open && setEditingProgram(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Program</DialogTitle>
              <DialogDescription>Update program details</DialogDescription>
            </DialogHeader>
            {editingProgram && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="editProgramName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Program Name</label>
                  <Input 
                    id="editProgramName" 
                    placeholder="Enter program name"
                    value={editingProgram.name}
                    onChange={(e) => setEditingProgram({...editingProgram, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="editProgramDescription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                  <Textarea 
                    id="editProgramDescription" 
                    placeholder="Enter program description"
                    value={editingProgram.description}
                    onChange={(e) => setEditingProgram({...editingProgram, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="editProgramPrice" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Price ($)</label>
                    <Input 
                      id="editProgramPrice" 
                      type="number" 
                      placeholder="0.00"
                      value={editingProgram.price}
                      onChange={(e) => setEditingProgram({...editingProgram, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editProgramActive"
                    checked={editingProgram.is_active}
                    onCheckedChange={(checked) => setEditingProgram({...editingProgram, is_active: checked as boolean})}
                  />
                  <label htmlFor="editProgramActive" className="text-sm font-medium">Active</label>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleEditProgram}>Update Program</Button>
                  <Button variant="outline" onClick={() => setEditingProgram(null)}>Cancel</Button>
                </div>
              </div>
            )}
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
                  <Badge variant="secondary">{program.calculated_duration || 0} days</Badge>
                  <Badge variant="outline">{program.milestones.length} milestones</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700"
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
                    className="text-red-600 hover:text-red-600"
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
                        size="sm"
                        onClick={() => openAddMilestoneModal(program.id)}
                        className="bg-black text-white hover:bg-gray-800"
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
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Goal Days</label>
                          <Input 
                            type="number"
                            placeholder="e.g., 30"
                            value={program.newMilestoneForm.goal_days}
                            onChange={(e) => updateMilestoneForm(program.id, 'goal_days', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => handleAddMilestone(program.id)}
                          className="flex-1 bg-black text-white hover:bg-gray-800"
                        >
                          Add
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
                          {/* Goal Display */}
                          <div className="absolute left-16 top-2">
                            <Badge variant="secondary" className="text-xs font-medium">
                              Goal: {milestone.goal_days || 0} days
                            </Badge>
                          </div>
                          <div className="ml-16 mt-8">
                            <MilestoneCard
                              milestone={milestone}
                              isExpanded={expandedMilestones.has(milestone.id)}
                              onToggle={() => toggleMilestoneExpansion(milestone.id)}
                              onDelete={(milestoneId) => handleDeleteMilestone(program.id, milestoneId)}
                              onEdit={(milestoneId, newTitle, newDescription) => {
                                handleEditMilestone(program.id, milestoneId, newTitle, newDescription)
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

        {/* Add Milestone Modal */}
        {isAddMilestoneModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Milestone</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddMilestoneModalOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Title</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">3-100 characters</span>
                        {modalMilestoneForm.title.length >= 3 && modalMilestoneForm.title.length <= 100 && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                    </div>
                    <Input 
                      placeholder="Enter milestone title"
                      className="mt-1"
                      value={modalMilestoneForm.title}
                      onChange={(e) => {
                        setModalMilestoneForm(prev => ({ ...prev, title: e.target.value }))
                        if (milestoneErrors.title) clearMilestoneErrors()
                      }}
                      maxLength={100}
                    />
                    <div className="mt-1">
                      <span className="text-xs text-red-600">{milestoneErrors.title}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">10-500 characters</span>
                        {modalMilestoneForm.description.length >= 10 && modalMilestoneForm.description.length <= 500 && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                    </div>
                    <Textarea 
                      placeholder="Enter milestone description"
                      className="mt-1"
                      rows={3}
                      value={modalMilestoneForm.description}
                      onChange={(e) => {
                        setModalMilestoneForm(prev => ({ ...prev, description: e.target.value }))
                        if (milestoneErrors.description) clearMilestoneErrors()
                      }}
                      maxLength={500}
                    />
                    <div className="mt-1">
                      <span className="text-xs text-red-600">{milestoneErrors.description}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Goal Days</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Must be positive number</span>
                        {parseInt(modalMilestoneForm.goal_days) > 0 && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                    </div>
                    <Input 
                      type="number"
                      placeholder="e.g., 30"
                      className="mt-1"
                      min="1"
                      value={modalMilestoneForm.goal_days}
                      onChange={(e) => {
                        setModalMilestoneForm(prev => ({ ...prev, goal_days: e.target.value }))
                        if (milestoneErrors.goal_days) clearMilestoneErrors()
                      }}
                    />
                    <div className="mt-1">
                      <span className="text-xs text-red-600">{milestoneErrors.goal_days}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button 
                    className="flex-1 bg-black text-white hover:bg-gray-800"
                    onClick={handleModalAddMilestone}
                  >
                    Add
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsAddMilestoneModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
