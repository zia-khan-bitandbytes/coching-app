"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { 
  CheckCircle, 
  Clock, 
  Lock, 
  Play, 
  Target, 
  Trophy, 
  Star, 
  BookOpen, 
  Zap, 
  Award, 
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Users,
  File,
  Download,
  Upload
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
  program_name: string
  program_id: number
  tasks: Task[]
}

interface ProgramWithMilestones {
  id: string
  name: string
  description: string
  duration_weeks: number
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

interface Program {
  id: string
  name: string
  description: string
  duration_weeks: number
  price: number
  enrolled_at: string
  status: string
}

interface CustomerStats {
  totalPrograms: number
  completedMilestones: number
  totalMilestones: number
  completionRate: number
}

interface CustomerRoadmapProps {
  customerId: string
}

const milestoneIcons = [
  BookOpen, Target, Zap, Play, Award, GraduationCap, Star
]

export function CustomerRoadmap({ customerId }: CustomerRoadmapProps) {
  const { toast } = useToast()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [coach, setCoach] = useState<Coach | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [programsWithMilestones, setProgramsWithMilestones] = useState<ProgramWithMilestones[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    totalPrograms: 0,
    completedMilestones: 0,
    totalMilestones: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set())
  const [updatingMilestones, setUpdatingMilestones] = useState<Set<string>>(new Set())
  const [updatingTasks, setUpdatingTasks] = useState<Set<number>>(new Set())
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
      const [coachResponse, programsResponse, milestonesResponse, statsResponse] = await Promise.all([
        fetch(`/api/customer/${customerId}/coach`),
        fetch(`/api/customer/${customerId}/programs`),
        fetch(`/api/customer/${customerId}/milestones`),
        fetch(`/api/customer/${customerId}/stats`)
      ])

      if (coachResponse.ok) {
        const coachData = await coachResponse.json()
        if (coachData.coach) {
          setCoach(coachData.coach)
        }
      }

      // Handle programs data
      let programsData = null
      if (programsResponse.ok) {
        programsData = await programsResponse.json()
        if (programsData.programs) {
          setPrograms(programsData.programs)
        } else {
          setPrograms([])
        }
      } else {
        setPrograms([])
      }

      // Handle milestones data
      if (milestonesResponse.ok) {
        const milestonesDataResult = await milestonesResponse.json()
        if (milestonesDataResult.milestones) {
          // Transform milestones to match the expected format
          const transformedMilestones = await Promise.all(
            milestonesDataResult.milestones.map(async (milestone: any) => {
              try {
                const tasksResponse = await fetch(`/api/customer/${customerId}/milestones/${milestone.id}/tasks`)
                if (tasksResponse.ok) {
                  const tasksData = await tasksResponse.json()
                  return {
                    ...milestone,
                    status: milestone.status || (milestone.completed ? "completed" : "in-progress"),
                    isLocked: milestone.isLocked !== undefined ? milestone.isLocked : false,
                    tasks: tasksData.success ? tasksData.tasks : []
                  }
                }
                return {
                  ...milestone,
                  status: milestone.status || (milestone.completed ? "completed" : "in-progress"),
                  isLocked: milestone.isLocked !== undefined ? milestone.isLocked : false,
                  tasks: []
                }
              } catch (error) {
                return {
                  ...milestone,
                  status: milestone.status || (milestone.completed ? "completed" : "in-progress"),
                  isLocked: milestone.isLocked !== undefined ? milestone.isLocked : false,
                  tasks: []
                }
              }
            })
          )
          setMilestones(transformedMilestones)
          
          // Group milestones by program and merge with program data
          if (programsData && programsData.programs) {
            const groupedPrograms = programsData.programs.map((program: Program) => {
              const programMilestones = transformedMilestones.filter(
                (milestone: Milestone) => milestone.program_name === program.name
              )
              const completedMilestones = programMilestones.filter(m => m.completed).length
              const totalMilestones = programMilestones.length
              const completionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
              
              return {
                ...program,
                milestones: programMilestones,
                completedMilestones,
                totalMilestones,
                completionRate
              }
            })
            setProgramsWithMilestones(groupedPrograms)
          } else {
            setProgramsWithMilestones([])
          }
        } else {
          setMilestones([])
          setProgramsWithMilestones([])
        }
      } else {
        setMilestones([])
        setProgramsWithMilestones([])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats)
        } else {
          console.error('Invalid stats response:', statsData)
          setStats({
            totalPrograms: 0,
            completedMilestones: 0,
            totalMilestones: 0,
            completionRate: 0
          })
        }
      } else {
        console.error('Stats response not ok:', statsResponse.status)
        setStats({
          totalPrograms: 0,
          completedMilestones: 0,
          totalMilestones: 0,
          completionRate: 0
        })
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
      setError('Failed to load roadmap data')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMilestone = (milestoneId: number) => {
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
          // Update the milestone in local state
          setMilestones(prev => prev.map(m => 
            m.id.toString() === milestoneId 
              ? { ...m, completed: true, completed_at: new Date().toISOString(), status: "completed" }
              : m
          ))
          
          // Refresh stats to update completion rate
          fetchCustomerData()
          
          toast({
            title: 'Milestone marked complete!',
            description: `"${milestones.find(m => m.id.toString() === milestoneId)?.title}" has been marked as complete.`,
          })
        } else {
          console.error('Failed to mark milestone complete:', result.error)
          setError('Failed to mark milestone complete')
          toast({
            title: 'Marking milestone failed',
            description: result.error || 'Failed to mark milestone complete.',
            variant: 'destructive',
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to mark milestone complete:', response.status, errorData)
        
        // Handle specific milestone progression errors
        if (response.status === 400 && errorData.incompleteMilestones) {
          const incompleteMilestones = errorData.incompleteMilestones
          const milestoneNames = incompleteMilestones.map((m: any) => `Milestone ${m.order_index}`).join(', ')
          
          toast({
            title: 'Cannot Complete Milestone Yet',
            description: `You must complete ${milestoneNames} first before proceeding.`,
            variant: 'destructive',
          })
        } else {
          setError('Failed to mark milestone complete')
          toast({
            title: 'Marking milestone failed',
            description: errorData.error || `Failed to mark milestone complete: ${response.status}`,
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      console.error('Error marking milestone complete:', error)
      setError('Error marking milestone complete')
      toast({
        title: 'Marking milestone failed',
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

  const handleTaskComplete = async (taskId: number, milestoneId: number) => {
    try {
      setUpdatingTasks(prev => new Set(prev).add(taskId))
      
      const response = await fetch(`/api/customer/${customerId}/milestones/${milestoneId}/tasks`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: taskId,
          completed: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          // Update the task in local state
          setMilestones(prev => prev.map(m => 
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
          ))
          
          // Update programsWithMilestones state as well
          setProgramsWithMilestones(prev => prev.map(program => ({
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
          })))
          
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
        toast({
          title: 'Failed to complete task',
          description: 'Unable to mark task as complete. Please try again.',
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
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-6 w-6 text-green-500" />
      case "in-progress": return <Play className="h-6 w-6 text-blue-500" />
      case "locked": return <Lock className="h-6 w-6 text-gray-400" />
      default: return <Target className="h-6 w-6 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return 'bg-green-100 text-green-800 border-green-200'
      case "in-progress": return 'bg-blue-100 text-blue-800 border-blue-200'
      case "locked": return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getMilestoneIcon = (index: number) => {
    return milestoneIcons[index % milestoneIcons.length]
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Calculate overall progress from programsWithMilestones if available, otherwise fall back to milestones
  const totalProgress = programsWithMilestones.length > 0
    ? Math.round((programsWithMilestones.reduce((acc, p) => acc + p.completedMilestones, 0) / programsWithMilestones.reduce((acc, p) => acc + p.totalMilestones, 0)) * 100) || 0
    : milestones.length > 0 
    ? Math.round((milestones.filter(m => m.status === "completed").length / milestones.length) * 100)
    : 0

  const completedMilestones = programsWithMilestones.length > 0 
    ? programsWithMilestones.reduce((acc, p) => acc + p.completedMilestones, 0)
    : milestones.filter(m => m.status === "completed").length
  const totalMilestones = programsWithMilestones.length > 0
    ? programsWithMilestones.reduce((acc, p) => acc + p.totalMilestones, 0)
    : milestones.length
  const latestCompletedIndex = milestones.length > 0 ? milestones.findLastIndex(m => m.status === "completed") : -1
  // If all milestones are completed, avatar should be at the end (100%)
  // If no milestones completed, avatar should be at the start (0%)
  // Otherwise, avatar should be at the position of the latest completed milestone


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

  return (
    <div className="space-y-8">

      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600 mt-1">Track your progress and continue your coaching journey</p>
      </div>

      {/* Coach Information */}
      {coach && (
        <Card>
          <CardHeader>
            <CardTitle>Your Coach</CardTitle>
            <CardDescription>Professional guidance for your success</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{coach.business_name}</h3>
                <p className="text-gray-600">{coach.name} - {coach.specialization}</p>
                <p className="text-sm text-gray-500 mt-1">{coach.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms || 0}</div>
            <p className="text-xs text-muted-foreground">Active programs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Milestones</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedMilestones || 0}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalMilestones || 0} total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Summary */}
      <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
      >
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall Progress Summary</h2>
          <p className="text-gray-600">Your combined progress across all programs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Completed Milestones */}
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{completedMilestones}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>

          {/* Total Milestones */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-700">{totalMilestones}</div>
            <div className="text-sm text-blue-600">Total</div>
          </div>

          {/* Completion Rate */}
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-700">{totalProgress}%</div>
            <div className="text-sm text-purple-600">Completion Rate</div>
          </div>
        </div>
      </motion.div>

      {/* Programs with Roadmaps */}
      {programsWithMilestones.length > 0 && programsWithMilestones.map((program, programIndex) => {
        // Define different color schemes for each program
        const colorSchemes = [
          {
            gradient: "from-blue-50 via-indigo-50 to-purple-50",
            border: "border-blue-200",
            accent: "text-blue-600",
            progressGradient: "from-blue-500 via-indigo-500 to-purple-500",
            roadmapGradient: "from-blue-500 to-purple-500",
            icon: "bg-blue-100 text-blue-600"
          },
          {
            gradient: "from-emerald-50 via-teal-50 to-cyan-50",
            border: "border-emerald-200",
            accent: "text-emerald-600",
            progressGradient: "from-emerald-500 via-teal-500 to-cyan-500",
            roadmapGradient: "from-emerald-500 to-cyan-500",
            icon: "bg-emerald-100 text-emerald-600"
          },
          {
            gradient: "from-orange-50 via-amber-50 to-yellow-50",
            border: "border-orange-200",
            accent: "text-orange-600",
            progressGradient: "from-orange-500 via-amber-500 to-yellow-500",
            roadmapGradient: "from-orange-500 to-yellow-500",
            icon: "bg-orange-100 text-orange-600"
          },
          {
            gradient: "from-rose-50 via-pink-50 to-fuchsia-50",
            border: "border-rose-200",
            accent: "text-rose-600",
            progressGradient: "from-rose-500 via-pink-500 to-fuchsia-500",
            roadmapGradient: "from-rose-500 to-fuchsia-500",
            icon: "bg-rose-100 text-rose-600"
          },
          {
            gradient: "from-violet-50 via-purple-50 to-indigo-50",
            border: "border-violet-200",
            accent: "text-violet-600",
            progressGradient: "from-violet-500 via-purple-500 to-indigo-500",
            roadmapGradient: "from-violet-500 to-indigo-500",
            icon: "bg-violet-100 text-violet-600"
          }
        ]
        
        const scheme = colorSchemes[programIndex % colorSchemes.length]
            
            return (
              <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: programIndex * 0.2 }}
            className={`space-y-6 mb-12 relative ${programIndex > 0 ? 'mt-16' : ''}`}
          >
            {/* Program Divider */}
            {programIndex > 0 && (
                <motion.div
                className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: programIndex * 0.2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-32"></div>
                  <div className="bg-white rounded-full p-3 shadow-lg border-2 border-gray-200">
                    <GraduationCap className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-32"></div>
                </div>
                  </motion.div>
            )}
                  
            {/* Program Header with Enhanced Styling */}
                  <motion.div
              className={`bg-gradient-to-r ${scheme.gradient} rounded-2xl p-8 border-2 ${scheme.border} shadow-xl relative overflow-hidden`}
              whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
              transition={{ duration: 0.3 }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-current"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full border-2 border-current"></div>
              </div>
              
              {/* Program Number Badge */}
                      <motion.div
                className={`absolute top-4 right-4 w-12 h-12 rounded-full ${scheme.icon} flex items-center justify-center text-xl font-bold shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                {programIndex + 1}
                      </motion.div>
                      
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex-1">
                      <motion.div
                    className="flex items-center gap-4 mb-3"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`w-16 h-16 rounded-xl ${scheme.icon} flex items-center justify-center shadow-lg`}>
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className={`text-3xl font-bold ${scheme.accent} mb-1`}>{program.name}</h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${scheme.accent} border-current bg-white/50`}>
                          Program {programIndex + 1}
                        </Badge>
                        <Badge variant={program.status === 'active' ? 'default' : 'secondary'} className="shadow-sm">
                          {program.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                      </motion.div>
                  
                  <p className="text-gray-700 text-lg mb-4 leading-relaxed">{program.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{program.duration_weeks} weeks duration</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Enrolled: {program.enrolled_at ? new Date(program.enrolled_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress Circle */}
                <motion.div
                  className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
                    whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  >
                  <motion.div
                    className={`text-5xl font-bold ${scheme.accent} mb-2`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, delay: programIndex * 0.3, type: "spring", stiffness: 200 }}
                  >
                    {program.completionRate}%
                  </motion.div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Complete</div>
                  <div className="text-xs text-gray-500">
                    {program.completedMilestones} of {program.totalMilestones} milestones
                  </div>
                  
                  {/* Mini Progress Ring */}
                  <div className="relative w-16 h-16 mx-auto mt-3">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200"
                      />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        className={scheme.accent}
                        initial={{ strokeDasharray: "0 176" }}
                        animate={{ strokeDasharray: `${(program.completionRate / 100) * 176} 176` }}
                        transition={{ duration: 2, delay: programIndex * 0.3 }}
                      />
                    </svg>
                  </div>
                </motion.div>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>Program Progress</span>
                  <span>{program.completionRate}% Complete</span>
                </div>
                <div className="relative h-4 bg-white/50 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${scheme.progressGradient} rounded-full relative`}
                    initial={{ width: 0 }}
                    animate={{ width: `${program.completionRate}%` }}
                    transition={{ duration: 2, delay: programIndex * 0.3 + 0.5, ease: "easeOut" }}
                  >
                    <motion.div
                      className="absolute top-0 right-0 h-full w-1 bg-white opacity-80"
                      animate={{ 
                        x: [0, -15, 0],
                        opacity: [0.8, 0.3, 0.8]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
              </motion.div>
        </div>
              </div>
            </motion.div>


        
          {/* Program Milestone Details */}
      <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className={`text-lg font-semibold ${scheme.accent} mb-2`}>
                {program.name} - Milestone Details
              </h3>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
            {program.milestones.map((milestone, index) => {
          const Icon = getMilestoneIcon(index)
          const isExpanded = expandedMilestones.has(milestone.id)
          const taskCompletionRate = milestone.tasks.length > 0 
            ? Math.round((milestone.tasks.filter(t => t.completed).length / milestone.tasks.length) * 100)
            : 0

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`transition-all duration-300 border-2 ${
                milestone.status === "in-progress" ? `${scheme.border} bg-white/80` : "border-gray-200 bg-white"
              } ${milestone.isLocked ? "opacity-60 bg-gray-50" : ""} hover:shadow-xl hover:scale-[1.01]`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <motion.div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          milestone.status === "completed" ? "bg-green-500" :
                          milestone.status === "in-progress" ? scheme.icon.replace('text-', 'bg-').replace('-100', '-500') + ' text-white' :
                          "bg-gray-300"
                        }`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        animate={{
                          boxShadow: milestone.status === "completed" 
                            ? ["0 4px 12px rgba(34, 197, 94, 0.3)", "0 8px 20px rgba(34, 197, 94, 0.4)", "0 4px 12px rgba(34, 197, 94, 0.3)"]
                            : milestone.status === "in-progress"
                              ? ["0 4px 12px rgba(59, 130, 246, 0.3)", "0 8px 20px rgba(59, 130, 246, 0.4)", "0 4px 12px rgba(59, 130, 246, 0.3)"]
                              : "0 2px 8px rgba(0, 0, 0, 0.1)"
                        }}
                        transition={{
                          boxShadow: { duration: 2, repeat: Infinity, repeatDelay: 1 }
                        }}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-2"
                          >
                            <CardTitle className="text-lg">{milestone.title}</CardTitle>
                            {milestone.isLocked && (
                              <motion.span 
                                className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                Locked - Complete previous milestone first
                              </motion.span>
                            )}
                          </motion.div>
                        </div>
                        <motion.p 
                          className="text-sm text-gray-600 mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          {milestone.description}
                        </motion.p>
                        <motion.div 
                          className="flex items-center gap-4 mt-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status.replace('-', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">#{milestone.order_index}</span>
                          <span className="text-sm text-gray-500">{milestone.program_name}</span>
                        </motion.div>
                      </div>
                    </div>
                    <motion.div 
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                    >
                      {milestone.status === "in-progress" && !milestone.isLocked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkComplete(milestone)}
                          disabled={updatingMilestones.has(milestone.id.toString())}
                          className="hover:bg-green-50 hover:border-green-300 transition-colors"
                        >
                          {updatingMilestones.has(milestone.id.toString()) ? 'Updating...' : 'Mark Complete'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleMilestone(milestone.id)}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </motion.div>
                      </Button>
                    </motion.div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {milestone.tasks.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-gray-700">Tasks</h4>
                                <span className="text-xs text-gray-500">
                                  {milestone.tasks.filter(t => t.completed).length} of {milestone.tasks.length} completed
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                {milestone.tasks.map((task, taskIndex) => (
                                  <motion.div
                                    key={task.id}
                                    className={`flex items-center gap-2 text-sm p-3 rounded-md transition-colors ${
                                      task.completed ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                                    } ${updatingTasks.has(task.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{ 
                                      duration: 0.4, 
                                      delay: taskIndex * 0.1,
                                      type: "spring",
                                      stiffness: 100
                                    }}
                                    whileHover={{ 
                                      x: task.completed ? 0 : 5, 
                                      scale: task.completed ? 1 : 1.02,
                                      transition: { duration: 0.2 }
                                    }}
                                    onClick={() => {
                                      if (!task.completed && !updatingTasks.has(task.id)) {
                                        // For tasks that require upload, only allow completion if files are uploaded
                                        if (task.requiresUpload) {
                                          if (task.files && task.files.length > 0) {
                                            handleTaskComplete(task.id, milestone.id)
                                          } else {
                                            toast({
                                              title: "Upload required",
                                              description: "Please upload required files before completing this task.",
                                              variant: "destructive"
                                            })
                                          }
                                        } else {
                                          // For regular tasks, allow completion
                                          handleTaskComplete(task.id, milestone.id)
                                        }
                                      }
                                    }}
                                  >
                                    <motion.div 
                                      className={`w-4 h-4 rounded-full transition-colors flex items-center justify-center border-2 ${
                                        task.completed 
                                          ? 'bg-green-500 border-green-500' 
                                          : updatingTasks.has(task.id)
                                            ? 'bg-blue-100 border-blue-300'
                                            : task.requiresUpload && (!task.files || task.files.length === 0)
                                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                                              : 'bg-white border-gray-300 hover:border-green-400'
                                      }`}
                                      animate={{
                                        scale: task.completed ? [1, 1.2, 1] : updatingTasks.has(task.id) ? [1, 1.1, 1] : 1
                                      }}
                                      transition={{
                                        scale: { 
                                          duration: 0.5, 
                                          repeat: (task.completed || updatingTasks.has(task.id)) ? Infinity : 0, 
                                          repeatDelay: 2 
                                        }
                                      }}
                                    >
                                      {task.completed && (
                                        <CheckCircle className="h-3 w-3 text-white" />
                                      )}
                                      {updatingTasks.has(task.id) && !task.completed && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                      )}
                                    </motion.div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`${task.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                          {task.title}
                                        </span>
                                        {task.requiresUpload && (
                                          <Upload className="h-3 w-3 text-yellow-500" title="Upload required" />
                                        )}
                                      </div>
                                      
                                      {/* Upload functionality for tasks that require upload */}
                                      {task.requiresUpload && (
                                        <div className="mt-2 flex items-center gap-2">
                                          <Input
                                            type="file"
                                            onChange={async (e) => {
                                              const selectedFile = e.target.files?.[0]
                                              if (selectedFile) {
                                                try {
                                                  // Create FormData for file upload
                                                  const formData = new FormData()
                                                  formData.append('file', selectedFile)
                                                  formData.append('milestoneId', milestone.id.toString())
                                                  formData.append('taskId', task.id.toString())
                                                  formData.append('programId', program.id)
                                                  
                                                  const response = await fetch(`/api/customer/${customerId}/upload`, {
                                                    method: 'POST',
                                                    body: formData
                                                  })
                                                  
                                                  if (response.ok) {
                                                    const data = await response.json()
                                                    console.log('File uploaded successfully:', data)
                                                    
                                                    toast({
                                                      title: "File uploaded successfully",
                                                      description: `${selectedFile.name} has been uploaded successfully.`,
                                                    })
                                                    
                                                    // Refresh the data to show the uploaded file
                                                    fetchCustomerData()
                                                  } else {
                                                    toast({
                                                      title: "Upload failed",
                                                      description: "Failed to upload file. Please try again.",
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
                                            }}
                                            className="hidden"
                                            id={`customer-file-${task.id}`}
                                            accept=".pdf,.doc,.docx,.txt"
                                          />
                                          <button
                                            onClick={() => document.getElementById(`customer-file-${task.id}`)?.click()}
                                            className="p-1.5 text-yellow-600 hover:text-white hover:bg-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm transition-all duration-200"
                                            title="Upload required file"
                                          >
                                            <Upload className="h-4 w-4" />
                                          </button>
                                          <span className="text-xs text-gray-500">Upload required</span>
                                          {/* Only show complete button if files have been uploaded */}
                                          {task.files && task.files.length > 0 ? (
                                            <button
                                              onClick={async () => {
                                                try {
                                                  await handleTaskComplete(task.id, milestone.id)
                                                  toast({
                                                    title: "Task completed",
                                                    description: "Task has been marked as complete.",
                                                  })
                                                } catch (error) {
                                                  console.error('Error completing task:', error)
                                                  toast({
                                                    title: "Error",
                                                    description: "Failed to complete task. Please try again.",
                                                    variant: "destructive"
                                                  })
                                                }
                                              }}
                                              className="p-1.5 text-green-600 hover:text-white hover:bg-green-600 bg-green-50 border border-green-200 rounded-lg shadow-sm transition-all duration-200"
                                              title="Mark task as complete"
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                            </button>
                                          ) : (
                                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                              Upload files to complete
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Display uploaded files */}
                                      {task.files && task.files.length > 0 && (
                                                                                <div className="mt-2 space-y-1">
                                          <p className="text-xs font-medium text-gray-600">
                                            {task.requiresUpload ? 'Your uploaded files:' : 'Uploaded Files:'}
                                          </p>
                                          <div className="space-y-1">
                                            {task.files.map((file: any, fileIndex: number) => (
                                              <div key={fileIndex} className="flex items-center gap-2 p-1 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors group">
                                                <File className="h-3 w-3 text-blue-500" />
                                                <a
                                                  href={file.url}
                                                  download={file.name}
                                                  className="text-xs text-blue-600 hover:text-blue-800 underline truncate max-w-32 cursor-pointer flex-1"
                                                  title={`Click to download ${file.name}`}
                                                  onClick={async (e) => {
                                                    e.preventDefault()
                                                    console.log('Downloading file:', file)
                                                    console.log('File URL:', file.url)
                                                    console.log('File name:', file.name)
                                                    
                                                    if (!file.url) {
                                                      toast({
                                                        title: "Error",
                                                        description: "File URL is not available",
                                                        variant: "destructive"
                                                      })
                                                      return
                                                    }
                                                    
                                                    try {
                                                      // Fetch the file
                                                      const response = await fetch(file.url)
                                                      if (!response.ok) {
                                                        throw new Error(`HTTP error! status: ${response.status}`)
                                                      }
                                                      
                                                      // Get the file blob
                                                      const blob = await response.blob()
                                                      
                                                      // Create a download link
                                                      const url = window.URL.createObjectURL(blob)
                                                      const link = document.createElement('a')
                                                      link.href = url
                                                      link.download = file.name
                                                      document.body.appendChild(link)
                                                      link.click()
                                                      document.body.removeChild(link)
                                                      
                                                      // Clean up the URL object
                                                      window.URL.revokeObjectURL(url)
                                                      
                                                      toast({
                                                        title: "Download started",
                                                        description: `${file.name} is being downloaded`,
                                                      })
                                                    } catch (error) {
                                                      console.error('Download error:', error)
                                                      toast({
                                                        title: "Download failed",
                                                        description: "Failed to download the file. Please try again.",
                                                        variant: "destructive"
                                                      })
                                                    }
                                                  }}
                                                >
                                                  {file.name}
                                                </a>
                                                <span className="text-xs text-gray-500">
                                                  ({formatFileSize(file.size)})
                                                </span>
                                                                                                 <button
                                                   onClick={async () => {
                                                     console.log('Downloading file via button:', file.url)
                                                     
                                                     if (!file.url) {
                                                       toast({
                                                         title: "Error",
                                                         description: "File URL is not available",
                                                         variant: "destructive"
                                                       })
                                                       return
                                                     }
                                                     
                                                     try {
                                                       // Fetch the file
                                                       const response = await fetch(file.url)
                                                       if (!response.ok) {
                                                         throw new Error(`HTTP error! status: ${response.status}`)
                                                       }
                                                       
                                                       // Get the file blob
                                                       const blob = await response.blob()
                                                       
                                                       // Create a download link
                                                       const url = window.URL.createObjectURL(blob)
                                                       const link = document.createElement('a')
                                                       link.href = url
                                                       link.download = file.name
                                                       document.body.appendChild(link)
                                                       link.click()
                                                       document.body.removeChild(link)
                                                       
                                                       // Clean up the URL object
                                                       window.URL.revokeObjectURL(url)
                                                       
                                                       toast({
                                                         title: "Download started",
                                                         description: `${file.name} is being downloaded`,
                                                       })
                                                     } catch (error) {
                                                       console.error('Download error:', error)
                                                       toast({
                                                         title: "Download failed",
                                                         description: "Failed to download the file. Please try again.",
                                                         variant: "destructive"
                                                       })
                                                     }
                                                   }}
                                                  className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-200 rounded transition-colors"
                                                  title={`Download ${file.name}`}
                                                >
                                                  <Download className="h-3 w-3" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    {task.requiresUpload && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.5 }}
                                      >
                                        <Badge variant="outline" className="text-xs">
                                          Upload Required
                                        </Badge>
                                      </motion.div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>Task Progress</span>
                                  <span>{taskCompletionRate}%</span>
                                </div>
                                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${taskCompletionRate}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                  />
                                  <motion.div
                                    className="absolute top-0 right-0 h-full w-1 bg-white opacity-80"
                                    animate={{ 
                                      x: [0, -15, 0],
                                      opacity: [0.8, 0.3, 0.8]
                                    }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2">
                            {milestone.status === "completed" && (
                              <div className="flex items-center gap-2 text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4" />
                                <span>Milestone Completed</span>
                                {milestone.completed_at && (
                                  <span className="text-xs text-gray-500">
                                    on {new Date(milestone.completed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {milestone.isLocked && (
                              <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Lock className="h-4 w-4" />
                                <span>Locked - Complete previous milestone first</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}
      </div>
          </motion.div>
        )
      })}





      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Confirmation Dialog for Milestone Completion */}
      {confirmMilestone && (
        <AlertDialog open={!!confirmMilestone} onOpenChange={(open) => !open && setConfirmMilestone(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Mark Complete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark "{confirmMilestone.title}" from "{confirmMilestone.program_name}" as complete? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmMarkComplete}
                disabled={updatingMilestones.has(confirmMilestone.id.toString())}
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
