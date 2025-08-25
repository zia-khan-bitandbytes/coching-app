"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  Clock, 
  Lock, 
  Play, 
  Target, 
  Trophy, 
  BookOpen, 
  Zap, 
  Award, 
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Calendar,
  TrendingUp,
  AlertCircle,
  Upload,
  File
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
  order_index: number
  requiresUpload: boolean
  created_at?: string
  completed_at?: string
  files?: Array<{
    id: number
    name: string
    size: number
    type: string
    url: string
    uploadedAt: string
  }>
}

interface Milestone {
  id: number
  title: string
  description: string
  status: "completed" | "in-progress" | "locked"
  order_index: number
  isLocked: boolean
  completed: boolean
  completed_at?: string
  progress_created_at?: string // When milestone progress record was created (started)
  notes?: string
  program_name: string
  program_id: number
  goal_days?: number
  isOverdue?: boolean
  daysOverdue?: number
  completionTime?: {
    actualDays: number
    goalDays: number
    isOnTime: boolean
    daysSaved: number
    daysOver: number
  }
  tasks: Task[]
}

interface ProgramWithMilestones {
  id: string
  name: string
  description: string
  calculated_duration?: number
  price: number
  enrolled_at: string
  status: string
  milestones: Milestone[]
  completedMilestones: number
  totalMilestones: number
  completionRate: number
}

interface Coach {
  id: string
  business_name: string
  name: string
  specialization: string
  bio: string
}

interface CustomerRoadmapProps {
  customerId: string
}

const milestoneIcons = [
  BookOpen, Target, Zap, Play, Award, GraduationCap, Trophy
]

export function CustomerRoadmap({ customerId }: CustomerRoadmapProps) {
  const { toast } = useToast()
  const [programsWithMilestones, setProgramsWithMilestones] = useState<ProgramWithMilestones[]>([])
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set())
  const [updatingMilestones, setUpdatingMilestones] = useState<Set<string>>(new Set())
  const [confirmMilestone, setConfirmMilestone] = useState<Milestone | null>(null)

  useEffect(() => {
    fetchCustomerData()
  }, [customerId])

  const fetchCustomerData = async () => {
    if (!customerId) {
      setError('Customer ID is required')
      setLoading(false)
      return
    }

    try {
      setError(null)
      const [coachResponse, programsResponse] = await Promise.all([
        fetch(`/api/customer/${customerId}/coach`),
        fetch(`/api/customer/${customerId}/programs`)
      ])

      if (coachResponse.ok) {
        const coachData = await coachResponse.json()
        if (coachData.coach) {
          setCoach(coachData.coach)
        }
      }

      if (programsResponse.ok) {
        const programsData = await programsResponse.json()
        if (programsData.programs) {
          setProgramsWithMilestones(programsData.programs)
        } else {
          setProgramsWithMilestones([])
        }
      } else {
        setProgramsWithMilestones([])
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
      setError('Failed to load roadmap data')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMilestone = async (milestoneId: number) => {
    // Find the milestone to check if it's locked
    const milestone = programsWithMilestones
      .flatMap(p => p.milestones)
      .find(m => m.id === milestoneId)
    
    // Prevent locked milestones from being expanded
    if (milestone?.isLocked) {
      return
    }
    
    setExpandedMilestones(prev => {
      const newSet = new Set(prev)
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId)
      } else {
        newSet.add(milestoneId)
        // Load tasks when milestone is expanded
        loadMilestoneTasks(milestoneId)
      }
      return newSet
    })
  }

  const loadMilestoneTasks = async (milestoneId: number) => {
    try {
      const response = await fetch(`/api/customer/${customerId}/milestones/${milestoneId}/tasks`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.tasks) {
          // Tasks now come with files directly from the API
          const tasksWithFiles = result.tasks.map((task: any) => ({
            ...task,
            // The API already returns requiresUpload, don't override it
            // Clean the description to remove [FILES:...] JSON data
            description: cleanTaskDescription(task.description)
          }))
          

          
          // Update the milestone with its tasks
          setProgramsWithMilestones(prev => prev.map(program => ({
            ...program,
            milestones: program.milestones.map(m => 
              m.id === milestoneId
                ? { ...m, tasks: tasksWithFiles }
                : m
            )
          })))
        }
      }
    } catch (error) {
      console.error('Error loading milestone tasks:', error)
    }
  }

  const handleMarkComplete = (milestone: Milestone) => {
    setConfirmMilestone(milestone)
  }

  const confirmMarkComplete = async () => {
    if (!confirmMilestone) return
    
    await markComplete(confirmMilestone.id.toString())
    setConfirmMilestone(null)
  }

  const markComplete = async (milestoneId: string) => {
    try {
      setUpdatingMilestones(prev => new Set(prev).add(milestoneId))
      
      const response = await fetch(`/api/customer/${customerId}/milestones/${milestoneId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
          notes: 'Marked as complete by customer'
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          setProgramsWithMilestones(prev => prev.map(program => ({
            ...program,
            milestones: program.milestones.map(m => 
              m.id.toString() === milestoneId
                ? { 
                    ...m, 
                    completed: true, 
                    completed_at: new Date().toISOString(), 
                    status: "completed",
                    progress_created_at: m.progress_created_at || new Date().toISOString() // Ensure progress_created_at exists
                  }
                : m
            )
          })))
          
          toast({
            title: 'Milestone completed!',
            description: `"${confirmMilestone?.title}" has been marked as complete.`,
          })
          
          fetchCustomerData()
        } else {
          toast({
            title: 'Failed to complete milestone',
            description: result.error || 'Failed to mark milestone complete.',
            variant: 'destructive',
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
          toast({
          title: 'Failed to complete milestone',
          description: errorData.error || 'Failed to mark milestone complete.',
            variant: 'destructive',
          })
      }
    } catch (error) {
      console.error('Error marking milestone complete:', error)
      toast({
        title: 'Failed to complete milestone',
        description: 'Error marking milestone complete.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingMilestones(prev => {
        const newSet = new Set(prev)
        newSet.delete(milestoneId)
        return newSet
      })
    }
  }

  const startMilestone = async (milestoneId: string) => {
    try {
      const response = await fetch(`/api/customer/${customerId}/milestones/${milestoneId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: false,
          notes: 'Milestone started'
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          // Update local state immediately for better UX
          setProgramsWithMilestones(prev => prev.map(program => ({
            ...program,
            milestones: program.milestones.map(m => 
              m.id.toString() === milestoneId
                ? { 
                    ...m, 
                    progress_created_at: new Date().toISOString(), 
                    status: "in-progress", 
                    isLocked: false,
                    completed: false // Ensure completed is false when starting
                  }
                : m
            )
          })))
          
          toast({
            title: 'Milestone started!',
            description: 'You can now work on this milestone. The countdown timer has begun!',
          })
          
          // Don't refresh data immediately to avoid overriding local state
          // The local state update should be sufficient for immediate UI feedback
        }
      }
    } catch (error) {
      console.error('Error starting milestone:', error)
      toast({
        title: 'Failed to start milestone',
        description: 'An error occurred while starting the milestone.',
        variant: 'destructive',
      })
    }
  }

  const handleTaskComplete = async (taskId: number, milestoneId: number) => {
    try {
      const requestBody = {
        taskId: taskId,
        completed: true
      }

      
      const response = await fetch(`/api/customer/${customerId}/milestones/${milestoneId}/tasks`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          // Update the task in local state
          setProgramsWithMilestones(prev => {
            const updatedPrograms = prev.map(program => ({
              ...program,
              milestones: program.milestones.map(m => 
                m.id === milestoneId
                  ? {
                      ...m,
                      tasks: m.tasks.map(t => 
                        t.id === taskId 
                          ? { ...t, completed: true, completed_at: new Date().toISOString() }
                          : t
                      )
                    }
                  : m
              )
            }))
            

            
            return updatedPrograms
          })
          
          toast({
            title: 'Task completed!',
            description: 'Great job on completing this task.',
          })
        } else {
          toast({
            title: 'Failed to complete task',
            description: result.error || 'Unable to mark task as complete.',
            variant: 'destructive',
          })
        }
      } else {
        const errorResult = await response.json()
        toast({
          title: 'Failed to complete task',
          description: errorResult.error || 'Unable to mark task as complete.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error completing task:', error)
      toast({
        title: 'Failed to complete task',
        description: 'An error occurred while completing the task.',
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = async (file: File, milestoneId: number, taskId: number, programId: string) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('milestoneId', milestoneId.toString())
      formData.append('taskId', taskId.toString())
      formData.append('programId', programId)
      
      const response = await fetch(`/api/customer/${customerId}/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        
        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been uploaded successfully.`,
        })
        
        // Reload tasks for this milestone to show the uploaded file
        await loadMilestoneTasks(milestoneId)
      } else {
        const errorData = await response.json()
        toast({
          title: "Upload failed",
          description: errorData.error || "Failed to upload file. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Function to clean task description by removing [FILES:...] JSON data
  const cleanTaskDescription = (description: string) => {
    if (!description || !description.includes('[FILES:')) {
      return description
    }
    
    try {
      // Remove the files section from description for display
      return description.replace(/\n\n\[FILES:[\s\S]*?\]$/, '')
    } catch (error) {
      console.error('Error cleaning task description:', error)
      return description
    }
  }

  // Helper function to check if all tasks in a milestone are completed
  const areAllTasksCompleted = (milestone: Milestone) => {
    if (!milestone.tasks || milestone.tasks.length === 0) {
      return false
    }
    
    return milestone.tasks.every(task => task.completed === true)
  }

  // Helper function to check if a task has uploaded files (ONLY from task.files array)
  const taskHasUploadedFiles = (task: any) => {
    // Only check if task has files in the files array (customer-specific)
    return task.files && task.files.length > 0
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in-progress": return <Play className="h-5 w-5 text-blue-500" />
      case "locked": return <Lock className="h-5 w-5 text-gray-400" />
      default: return <Target className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return 'bg-green-100 text-green-800 border-green-200'
      case "in-progress": return 'bg-blue-100 text-blue-800 border-blue-200'
      case "locked": return 'bg-gray-100 text-gray-800 border-gray-200'
      case "locked": return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getMilestoneIcon = (index: number) => {
    return milestoneIcons[index % milestoneIcons.length]
  }

  const calculateDaysLeft = (milestone: Milestone) => {
      if (milestone.completed || !milestone.goal_days || !milestone.progress_created_at) return null
  
  const startDate = new Date(milestone.progress_created_at)
    const currentDate = new Date()
    const elapsedDays = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysLeft = milestone.goal_days - elapsedDays
    
    return daysLeft > 0 ? daysLeft : 0
  }

  const getOverallStats = () => {
    const totalPrograms = programsWithMilestones.length
    const totalMilestones = programsWithMilestones.reduce((acc, p) => acc + (p.totalMilestones || 0), 0)
    const completedMilestones = programsWithMilestones.reduce((acc, p) => acc + (p.completedMilestones || 0), 0)
    const completionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
    const overdueMilestones = programsWithMilestones.reduce((acc, program) => 
      acc + (program.milestones?.filter(m => m.isOverdue).length || 0), 0
    )
    
    return { totalPrograms, totalMilestones, completedMilestones, completionRate, overdueMilestones }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your roadmap...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">Error loading roadmap</p>
          <p className="text-gray-600">{error}</p>
          <Button onClick={fetchCustomerData} className="mt-4">Try Again</Button>
        </div>
      </div>
    )
  }

  if (programsWithMilestones.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Roadmap Available</h3>
        <p className="text-gray-600">You haven't been enrolled in any coaching programs yet.</p>
      </div>
    )
  }

  const stats = getOverallStats()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
              <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Coaching Roadmap</h1>
        <p className="text-lg text-gray-600">Track your progress and achieve your goals</p>
              </div>

      {/* Coach Information */}
      {coach && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                  <h3 className="text-xl font-semibold text-blue-900">{coach.business_name}</h3>
                  <p className="text-blue-700">{coach.name} - {coach.specialization}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="text-center">
          <CardContent className="p-6">
            <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-600">{stats.totalPrograms}</div>
            <p className="text-sm text-gray-600">Programs Enrolled</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-6">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600">{stats.completedMilestones}</div>
            <p className="text-sm text-gray-600">Milestones Completed</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-6">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-600">{stats.completionRate}%</div>
            <p className="text-sm text-gray-600">Overall Progress</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-6">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-orange-600">{stats.overdueMilestones}</div>
            <p className="text-sm text-gray-600">Overdue</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Programs Roadmap */}
      {programsWithMilestones.map((program, programIndex) => {
        const colorSchemes = [
          { primary: "blue", secondary: "indigo" },
          { primary: "emerald", secondary: "teal" },
          { primary: "purple", secondary: "violet" },
          { primary: "orange", secondary: "amber" },
          { primary: "rose", secondary: "pink" }
        ]
        
        const scheme = colorSchemes[programIndex % colorSchemes.length]
            
            return (
              <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: programIndex * 0.2 }}
            className="space-y-6"
          >
            {/* Program Header */}
            <Card className={`bg-gradient-to-r from-${scheme.primary}-50 to-${scheme.secondary}-50 border-${scheme.primary}-200`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-${scheme.primary}-100 rounded-lg flex items-center justify-center`}>
                      <BookOpen className={`w-6 h-6 text-${scheme.primary}-600`} />
                    </div>
                    <div>
                      <CardTitle className={`text-2xl text-${scheme.primary}-900`}>{program.name}</CardTitle>
                      <CardDescription className="text-gray-600">{program.description}</CardDescription>
                      </div>
                    </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold text-${scheme.primary}-600`}>{program.completionRate}%</div>
                    <div className="text-sm text-gray-600">
                      {program.completedMilestones} of {program.totalMilestones} milestones
                    </div>
                  </div>
                </div>
                
                {/* Program Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{program.completionRate}% Complete</span>
                </div>
                  <Progress value={program.completionRate} className={`h-3 bg-${scheme.primary}-100`} />
                  </div>
              </CardHeader>
            </Card>

            {/* Milestones Timeline */}
      <div className="space-y-4">
              {program.milestones.map((milestone, index) => {
          const Icon = getMilestoneIcon(index)
          const isExpanded = expandedMilestones.has(milestone.id)
                const daysLeft = calculateDaysLeft(milestone)
                const isOverdue = milestone.isOverdue && milestone.daysOverdue && milestone.daysOverdue > 0

          return (
            <motion.div
              key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className={`transition-all duration-300 hover:shadow-lg ${
                      milestone.completed ? "border-green-200 bg-green-50" :
                      milestone.progress_created_at ? "border-blue-200 bg-blue-50" :
                      !milestone.isLocked ? "border-orange-200 bg-orange-50" :
                      "border-gray-200"
                    }`}>
                      <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Milestone Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          milestone.completed ? "bg-green-500" :
                              milestone.progress_created_at ? "bg-blue-500" :
                              !milestone.isLocked ? "bg-orange-500" :
                          "bg-gray-300"
                            }`}>
                              <Icon className="w-6 h-6 text-white" />
                        </div>
                            
                            {/* Milestone Info */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getStatusColor(milestone.completed ? "completed" : milestone.progress_created_at ? "in-progress" : "locked")}>
                                    {milestone.completed ? "completed" : milestone.progress_created_at ? "in progress" : "locked"}
                                  </Badge>
                                  {milestone.isLocked && (
                                    <Lock className="w-4 h-4 text-gray-500" />
                                  )}
                                </div>
                          {milestone.goal_days && (
                                  <Badge variant="outline" className="text-xs">
                                    <Target className="w-3 h-3 mr-1" />
                                    {milestone.goal_days} days
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-gray-600 mb-3">{milestone.description}</p>
                              
                              {/* Milestone Status Summary */}
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {milestone.progress_created_at && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Started {new Date(milestone.progress_created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </Badge>
                                )}
                                
                                {milestone.completed_at && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed {new Date(milestone.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </Badge>
                                )}
                                
                                {milestone.goal_days && (
                                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                    <Target className="w-3 h-3 mr-1" />
                                    Goal: {milestone.goal_days} days
                                  </Badge>
                                )}
                                
                                {daysLeft !== null && daysLeft > 0 && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {daysLeft} days left
                                  </Badge>
                                )}
                                
                                {isOverdue && (
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {milestone.daysOverdue} days overdue
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Locked milestone message */}
                              {milestone.isLocked && (
                                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <Lock className="w-4 h-4" />
                                  <span>This milestone is locked. Complete the previous milestone to unlock it.</span>
                                </div>
                              )}
                              

                              

                              
                              {/* In-progress milestone message */}
                              {!milestone.isLocked && milestone.progress_created_at && !milestone.completed && (
                                <div className="flex items-center space-x-2 text-sm text-blue-600 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <Play className="w-4 h-4" />
                                  <span>Milestone started - You can now work on the tasks below.</span>
                                </div>
                              )}
                              
                              {/* Ready to complete milestone message */}
                              {!milestone.isLocked && milestone.progress_created_at && !milestone.completed && milestone.tasks && milestone.tasks.length > 0 && areAllTasksCompleted(milestone) && (
                                <div className="flex items-center space-x-2 text-sm text-green-600 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>All tasks completed! Click "Complete Milestone" to finish this milestone.</span>
                                </div>
                              )}
                              
                              {/* Visual Timeline */}
                              {(milestone.progress_created_at || milestone.completed_at) && (
                                <div className="mb-3">
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                                    <span className="font-medium">Timeline:</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {/* Enrollment/Start Point */}
                                    <div className="flex flex-col items-center">
                                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                      <span className="text-xs text-gray-500 mt-1">Enrolled</span>
                                    </div>
                                    
                                    {/* Timeline Line */}
                                    <div className="flex-1 h-0.5 bg-gray-300"></div>
                                    
                                    {/* Start Point */}
                                    {milestone.progress_created_at && (
                                      <>
                                        <div className="flex flex-col items-center">
                                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                          <span className="text-xs text-blue-600 mt-1">Started</span>
                                        </div>
                                        <div className="flex-1 h-0.5 bg-gray-300"></div>
                                      </>
                                    )}
                                    
                                    {/* Completion Point */}
                                    {milestone.completed_at ? (
                                      <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-green-600 mt-1">Completed</span>
                                      </div>
                                    ) : milestone.progress_created_at ? (
                                      <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 bg-orange-400 rounded-full border-2 border-dashed border-orange-300"></div>
                                        <span className="text-xs text-orange-600 mt-1">In Progress</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                        <span className="text-xs text-gray-500 mt-1">Locked</span>
                                      </div>
                                    )}
                                                                </div>
                            </div>
                          )}
                          
                          {/* Performance Summary */}
                          {milestone.completed_at && milestone.progress_created_at && milestone.goal_days && (
                            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-semibold text-purple-800">Performance Summary</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                {(() => {
                                  const startDate = new Date(milestone.progress_created_at)
                                  const endDate = new Date(milestone.completed_at)
                                  const actualDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                                  const daysDiff = milestone.goal_days - actualDays
                                  const efficiency = Math.round((milestone.goal_days / actualDays) * 100)
                                  
                                  return (
                                    <>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-purple-700">{actualDays}</div>
                                        <div className="text-xs text-purple-600">Days Taken</div>
                                      </div>
                                      <div className="text-center">
                                        <div className={`text-lg font-bold ${
                                          daysDiff > 0 ? 'text-green-700' : daysDiff < 0 ? 'text-orange-700' : 'text-blue-700'
                                        }`}>
                                          {daysDiff > 0 ? `+${daysDiff}` : daysDiff < 0 ? daysDiff : '0'}
                                        </div>
                                        <div className="text-xs text-gray-600">vs Goal</div>
                                      </div>
                                      <div className="text-center">
                                        <div className={`text-lg font-bold ${
                                          efficiency >= 100 ? 'text-green-700' : efficiency >= 80 ? 'text-orange-700' : 'text-red-700'
                                        }`}>
                                          {efficiency}%
                                        </div>
                                        <div className="text-xs text-gray-600">Efficiency</div>
                                      </div>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                          )}
                              
                              {/* Enhanced Timing Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 rounded-lg border">
                                <div className="space-y-2">
                                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Timeline</h5>
                                  
                                  {/* Start Date */}
                                  {milestone.progress_created_at ? (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span className="text-gray-600">Started:</span>
                                      <span className="font-medium text-blue-700">
                                        {new Date(milestone.progress_created_at).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  ) : !milestone.isLocked && milestone.goal_days ? (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      <span className="text-gray-600">Goal:</span>
                                      <span className="font-medium text-orange-700">{milestone.goal_days} days</span>
                                    </div>
                                  ) : null}
                                  
                                  {/* Completion Date */}
                                  {milestone.completed_at && (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-gray-600">Completed:</span>
                                      <span className="font-medium text-green-700">
                                        {new Date(milestone.completed_at).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Progress</h5>
                                  
                                  {/* Days Left */}
                                  {daysLeft !== null && daysLeft > 0 && (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <Clock className="w-4 h-4 text-blue-600" />
                                      <span className="text-gray-600">Time remaining:</span>
                                      <span className="font-medium text-blue-700">{daysLeft} days</span>
                                    </div>
                                  )}
                                  
                                  {/* Overdue Status */}
                                  {isOverdue && (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <AlertCircle className="w-4 h-4 text-red-600" />
                                      <span className="text-gray-600">Overdue by:</span>
                                      <span className="font-medium text-red-700">{milestone.daysOverdue} days</span>
                                    </div>
                                  )}
                                  
                                  {/* Completion Time vs Goal */}
                                  {milestone.completed_at && milestone.progress_created_at && milestone.goal_days && (
                                    (() => {
                                      const startDate = new Date(milestone.progress_created_at)
                                      const endDate = new Date(milestone.completed_at)
                                      const actualDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                                      const daysDiff = milestone.goal_days - actualDays
                                      
                                      return (
                                        <div className="flex items-center space-x-2 text-sm">
                                          <Target className="w-4 h-4 text-purple-600" />
                                          <span className="text-gray-600">Performance:</span>
                                          <span className={`font-medium ${
                                            daysDiff > 0 ? 'text-green-700' : daysDiff < 0 ? 'text-orange-700' : 'text-blue-700'
                                          }`}>
                                            {daysDiff > 0 ? `${daysDiff} days ahead` : daysDiff < 0 ? `${Math.abs(daysDiff)} days over` : 'On target'}
                                          </span>
                                        </div>
                                      )
                                    })()
                                  )}
                                </div>
                              </div>
                            </div>
                      </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            {/* Show Start button for unlocked milestones that haven't been started yet */}
                            {!milestone.isLocked && !milestone.progress_created_at && !milestone.completed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startMilestone(milestone.id.toString())}
                                className="hover:bg-blue-50 border-blue-200 text-blue-700"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Start Milestone
                              </Button>
                            )}
                            

                            
                            {/* Show Mark Complete button for milestones that are in progress */}
                            {!milestone.isLocked && milestone.progress_created_at && !milestone.completed && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleMarkComplete(milestone)}
                                disabled={
                                  updatingMilestones.has(milestone.id.toString()) ||
                                  !milestone.tasks || milestone.tasks.length === 0 ||
                                  !areAllTasksCompleted(milestone)
                                }
                                className={`${
                                  !milestone.tasks || milestone.tasks.length === 0 ||
                                  !areAllTasksCompleted(milestone)
                                    ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {updatingMilestones.has(milestone.id.toString()) 
                                  ? 'Updating...' 
                                  : !milestone.tasks || milestone.tasks.length === 0
                                    ? 'Load Tasks First'
                                    : !areAllTasksCompleted(milestone)
                                    ? 'Complete All Tasks First'
                                    : 'Complete Milestone'}
                              </Button>
                            )}
                            
                            {/* Debug info for milestone completion */}
                            {!milestone.isLocked && milestone.progress_created_at && !milestone.completed && (
                              <div className="text-xs text-gray-500 mt-1">
                                Debug: Tasks loaded: {milestone.tasks ? milestone.tasks.length : 0}, 
                                All completed: {milestone.tasks ? areAllTasksCompleted(milestone) : 'N/A'}
                              </div>
                            )}
                            
                      {/* Toggle button - only allow for non-locked milestones or to show locked status */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleMilestone(milestone.id)}
                        disabled={milestone.isLocked}
                        className={milestone.isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                  </div>
                        </div>

                        {/* Expanded Milestone Details */}
                <AnimatePresence>
                  {isExpanded && !milestone.isLocked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                              className="mt-6 pt-6 border-t border-gray-200"
                    >
                              {/* Tasks Section */}
                          {milestone.tasks && milestone.tasks.length > 0 && (
                            <div className="space-y-3">
                                  <h4 className="font-medium text-gray-900">Tasks ({milestone.tasks.filter(t => t.completed).length}/{milestone.tasks.length} completed)</h4>
                              <div className="space-y-3">
                                    {milestone.tasks.map((task) => (
                                      <div
                                    key={task.id}
                                        className={`p-4 rounded-lg border transition-all duration-200 ${
                                          task.completed 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3 flex-1">
                                            <div
                                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                                task.completed 
                                                  ? 'bg-green-500 border-green-500' 
                                                  : 'border-gray-300'
                                              }`}
                                            >
                                              {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                              <h5 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                {task.title}
                                              </h5>
                                              {task.description && (
                                                <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                                  {cleanTaskDescription(task.description)}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center space-x-2">
                                            {/* Upload File Button - Show for tasks that require upload */}
                                            {(task.requiresUpload || task.title === 'Testing') && (
                                              <div className="flex items-center space-x-2">
                                                {taskHasUploadedFiles(task) ? (
                                                  <div className="flex items-center space-x-2">
                                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                                      <CheckCircle className="w-3 h-3 mr-1" />
                                                      File Uploaded
                                                    </Badge>
                                                    <span className="text-xs text-gray-600">
                                                      {task.files && task.files.length > 0 ? task.files[0].name : 'File uploaded'}
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center space-x-2">
                                                    <input
                                                      type="file"
                                                      id={`task-file-${task.id}`}
                                                      className="hidden"
                                                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                                      onChange={async (e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) {
                                                          await handleFileUpload(file, milestone.id, task.id, program.id)
                                                        }
                                                      }}
                                                    />
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => document.getElementById(`task-file-${task.id}`)?.click()}
                                                      className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                                    >
                                                      <Upload className="w-3 h-3 mr-1" />
                                                      Upload Required File
                                                    </Button>
                                                    <Badge variant="destructive" className="text-xs">
                                                      Required
                                                    </Badge>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            
                                            {/* Mark Done Button - Only show when task can be completed */}
                                            {!task.completed && (
                                              <>
                                                {(task.requiresUpload || task.title === 'Testing') && !taskHasUploadedFiles(task) ? (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={true}
                                                    className="text-xs opacity-50 cursor-not-allowed"
                                                  >
                                                    <Upload className="w-3 h-3 mr-1" />
                                                    Upload File First
                                                  </Button>
                                                ) : (
                                                  <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleTaskComplete(task.id, milestone.id)}
                                                    className="text-xs bg-green-600 hover:bg-green-700 text-white"
                                                  >
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Mark Done
                                                  </Button>
                                                )}
                                              </>
                                            )}
                                            
                                            {/* Completed Badge */}
                                            {task.completed && (
                                              <Badge variant="default" className="text-xs bg-green-600 text-white">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Completed
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Display uploaded files */}
                                        {taskHasUploadedFiles(task) && (
                                          <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-xs font-medium text-gray-600 mb-2">Uploaded Files:</p>
                                            <div className="space-y-1">
                                              {task.files && task.files.length > 0 ? (
                                                // Display files from task.files array (customer-specific)
                                                task.files.map((file: any, fileIndex: number) => (
                                                  <div key={fileIndex} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                                                    <span className="text-blue-800 truncate">{file.name}</span>
                                                    <span className="text-xs text-blue-600">({formatFileSize(file.size)})</span>
                                                  </div>
                                                ))
                                              ) : null}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                ))}
                              </div>
                            </div>
                          )}

                              {/* Milestone Notes */}
                              {milestone.notes && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-600">{milestone.notes}</p>
                              </div>
                            )}
                    </motion.div>
                  )}
                </AnimatePresence>
                      </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
          </motion.div>
        )
      })}

      {/* Confirmation Dialog */}
      {confirmMilestone && (
        <AlertDialog open={!!confirmMilestone} onOpenChange={(open) => !open && setConfirmMilestone(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Milestone</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark "{confirmMilestone.title}" as complete? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmMarkComplete}
                disabled={updatingMilestones.has(confirmMilestone.id.toString())}
                className="bg-green-600 hover:bg-green-700"
              >
                {updatingMilestones.has(confirmMilestone.id.toString()) ? 'Updating...' : 'Mark Complete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
