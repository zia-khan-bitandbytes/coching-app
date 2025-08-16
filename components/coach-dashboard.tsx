"use client"
<<<<<<< HEAD

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
<<<<<<< HEAD
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3
} from "lucide-react"
import { motion } from "framer-motion"

interface CoachDashboardProps {
  coachId: string
=======
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, TrendingUp, CheckCircle, DollarSign, BookOpen, Target, Calendar, Plus, UserPlus, ChevronDown, ChevronRight, Edit, Trash2, AlertTriangle, Mail, Check, Copy, BarChart3 } from "lucide-react"
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
>>>>>>> signup-issue-resolved
}

export function CoachDashboard({ coachId }: CoachDashboardProps) {
  // Mock data for demonstration
  const kpiData = {
    totalClients: 247,
    clientSuccessRate: 75,
    timeToValue: 240,
    monthlyRevenue: 124500
  }

  const ttvBreakdown = [
    {
      milestone: "Milestone 1",
      completion: 28,
      goal: 30,
      status: "on-track",
      progress: 93
    },
    {
      milestone: "Milestone 2", 
      completion: 45,
      goal: 35,
      status: "over-target",
      progress: 78
    },
    {
      milestone: "Milestone 3",
      completion: 52,
      goal: 40,
      status: "over-target",
      progress: 77
    }
  ]

  const frictionZones = [
    {
      milestone: "Milestone 1",
      avgDays: 28,
      completion: 95,
      frictionLevel: "Low",
      status: "low"
    },
    {
      milestone: "Milestone 2",
      avgDays: 45,
      completion: 87,
      frictionLevel: "Medium",
      status: "medium"
    },
    {
      milestone: "Milestone 3",
      avgDays: 52,
      completion: 70,
      frictionLevel: "High Friction",
      status: "high"
    }
  ]

<<<<<<< HEAD
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on-track":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "over-target":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      default:
        return <Target className="h-5 w-5 text-gray-500" />
=======
export function CoachDashboard({ coachId }: { coachId: string }) {
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState(() => {
    // Get initial section from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem("activeSection") || "overview"
    }
    return "overview"
  })
  const [programs, setPrograms] = useState<Program[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState({
    totalPrograms: 0,
    totalCustomers: 0,
    totalMilestones: 0,
    totalRevenue: 0,
    activeEnrollments: 0,
    monthlyRevenue: 0,
    completionRate: 0
  })

  // Form states
  const [addProgramOpen, setAddProgramOpen] = useState(false)
  const [newProgram, setNewProgram] = useState({ name: '', description: '', duration_weeks: 4, price: 0 })
  
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', program_id: '' })
  
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [newMember, setNewMember] = useState({ email: '', name: '', program_id: '' })
  
  // Invitation states
  const [invitationData, setInvitationData] = useState<{
    email: string
    name: string
    program_id: string
  }>({
    email: "",
    name: "",
    program_id: ""
  })
  const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false)
  const [invitationLink, setInvitationLink] = useState("")
  const [showInvitationLink, setShowInvitationLink] = useState(false)
  const [copied, setCopied] = useState(false)

  // Task editing states
  const [editTaskOpen, setEditTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<{ milestoneId: string; taskId: string; task: Task } | null>(null)
  const [editTaskData, setEditTaskData] = useState({ title: '', description: '', requiresUpload: false })


  // UI states
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set())
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [activeTab, setActiveTab] = useState("overview")


  useEffect(() => {
    fetchCoachData()
  }, [coachId])

  useEffect(() => {
    // Listen for section changes from sidebar
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail)
    }

    window.addEventListener('sectionChange', handleSectionChange as EventListener)
    
    return () => {
      window.removeEventListener('sectionChange', handleSectionChange as EventListener)
    }
  }, [])



  const fetchCoachData = async () => {
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

      // Fetch customers
      const customersRes = await fetch(`/api/coach/${coachId}/customers`)
      const customersData = await customersRes.json()
      console.log('Customers response:', customersData)
      if (customersData.success) {
        setCustomers(customersData.customers)
      }

      // Fetch stats
      const statsRes = await fetch(`/api/coach/${coachId}/stats`)
      const statsData = await statsRes.json()
      console.log('Stats response:', statsData)
      if (statsData.success) {
        setStats(statsData.stats)
        console.log('Stats set to:', statsData.stats)
      }
    } catch (error) {
      console.error('Error fetching coach data:', error)
>>>>>>> signup-issue-resolved
    }
  }

  const getFrictionBadge = (level: string) => {
    switch (level) {
      case "low":
        return <Badge variant="secondary" className="bg-gray-900 text-white">Low</Badge>
      case "medium":
        return <Badge variant="secondary" className="bg-gray-900 text-white">Medium</Badge>
      case "high":
        return <Badge variant="destructive">High Friction</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getFrictionIcon = (status: string) => {
    switch (status) {
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Target className="h-5 w-5 text-gray-500" />
    }
  }

<<<<<<< HEAD
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your coaching business performance</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clients Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpiData.totalClients.toLocaleString()}</div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">+12%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">23 new this month</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Client Success Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Client Success Rate (CSR)</CardTitle>
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpiData.clientSuccessRate}%</div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">+5%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">185 of 247 completed</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Time To Value Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Time To Value (TTV)</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpiData.timeToValue} days</div>
              <p className="text-xs text-gray-600 mt-1">Goal: 180 days</p>
              <p className="text-xs text-orange-600 font-medium mt-1">60 days over target</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue $</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${kpiData.monthlyRevenue.toLocaleString()}</div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">+8%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">vs last month</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Sections Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time To Value (TTV) Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Time To Value (TTV) Breakdown</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Average completion time per milestone vs goals</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {ttvBreakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className="font-medium text-gray-700">{item.milestone}:</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{item.completion} days</span>
                      <span className="text-sm text-gray-500 ml-1">(Goal: {item.goal}d)</span>
                    </div>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Friction Zones Heatmap */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">Friction Zones Heatmap</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Where clients spend the most time and struggle</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {frictionZones.map((zone, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFrictionIcon(zone.status)}
                    <div>
                      <span className="font-medium text-gray-700">{zone.milestone}</span>
                      <p className="text-sm text-gray-500">
                        {zone.avgDays} days avg • {zone.completion}% completion
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getFrictionBadge(zone.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Performance Insights</CardTitle>
            </div>
            <p className="text-sm text-gray-600">Key areas to focus on for improvement</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">28</div>
                <div className="text-sm text-blue-600 font-medium">Avg Days to First Milestone</div>
                <div className="text-xs text-gray-500 mt-1">Target: 30 days</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">87%</div>
                <div className="text-sm text-orange-600 font-medium">Milestone 2 Completion</div>
                <div className="text-xs text-gray-500 mt-1">Needs attention</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">70%</div>
                <div className="text-sm text-red-600 font-medium">Final Milestone Success</div>
                <div className="text-xs text-gray-500 mt-1">Critical area</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
=======
=======
  const handleDeleteProgram = async (programId: string, programName: string) => {
    if (!confirm(`Are you sure you want to delete the program "${programName}"? This action cannot be undone and will also delete all associated milestones and tasks.`)) {
      return
    }

    try {
      const response = await fetch(`/api/coach/${coachId}/programs/${programId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Program deleted",
          description: `"${programName}" has been successfully deleted.`,
          variant: "default",
        })
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
    }
  }

  const handleDeleteMilestone = async (milestoneId: string, programId: string) => {
    try {
      const response = await fetch(`/api/coach/${coachId}/programs/${programId}/milestones?milestoneId=${milestoneId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchCoachData() // Refresh data
      }
    } catch (error) {
      console.error('Error deleting milestone:', error)
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
    if (!editingTask) return

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



  const handleAddMember = async () => {
    try {
      const response = await fetch('/api/coach/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMember, coach_id: coachId })
      })
      
      if (response.ok) {
        setAddMemberOpen(false)
        setNewMember({ email: '', name: '', program_id: '' })
        fetchCoachData() // Refresh data
      }
    } catch (error) {
      console.error('Error adding member:', error)
    }
  }

  const handleSendInvitation = async () => {
    if (!invitationData.email || !invitationData.name || !invitationData.program_id) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(invitationData.email.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return
    }

    // Trim whitespace from email and name
    const cleanEmail = invitationData.email.trim()
    const cleanName = invitationData.name.trim()

    try {
      const response = await fetch(`/api/coach/${coachId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: invitationData.email,
          name: invitationData.name,
          program_id: invitationData.program_id
        })
      })

      const data = await response.json()

      if (data.success) {
        setInvitationLink(data.invitationLink)
        setShowInvitationLink(true)
        toast({
          title: "Success",
          description: "Invitation email sent successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to send invitation',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to send invitation',
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Invitation link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to copy link',
        variant: "destructive"
      })
    }
  }

  const resetInvitationForm = () => {
    setInvitationData({ email: "", name: "", program_id: "" })
    setShowInvitationLink(false)
    setInvitationLink("")
    setCopied(false)
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

  const handleEditProgram = (program: Program) => {
    // This would open an edit dialog for the program
    // For now, just show a toast
    toast({
      title: "Edit Program",
      description: `Edit functionality for "${program.name}" will be implemented soon.`,
      variant: "default",
    })
  }

  const handleToggleTask = async (milestoneId: string, taskId: string, taskTitle: string) => {
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      })

      if (response.ok) {
        toast({
          title: "Task updated",
          description: `"${taskTitle}" has been marked as completed.`,
          variant: "default",
        })
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

  // Show different content based on active section
  if (activeSection === 'programs') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Your Coaching Programs</h3>
            <p className="text-sm text-gray-600">Manage programs and their milestones</p>
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
                    >
                      <Trash2 className="h-3 w-3" />
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
      </div>
    )
  }

  // Show customers section
  if (activeSection === 'customers') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Your Customers</h3>
            <p className="text-sm text-gray-600">Customers enrolled in your programs</p>
          </div>
          <Dialog open={isInvitationDialogOpen} onOpenChange={setIsInvitationDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Program Invitation</DialogTitle>
                <DialogDescription>Send an email invitation to join your coaching program</DialogDescription>
              </DialogHeader>
              
              {!showInvitationLink ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invite-name">Full Name</Label>
                    <Input
                      id="invite-name"
                      value={invitationData.name}
                      onChange={(e) => setInvitationData({ ...invitationData, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={invitationData.email}
                      onChange={(e) => setInvitationData({ ...invitationData, email: e.target.value })}
                      placeholder="Enter customer email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invite-program">Program</Label>
                    <Select value={invitationData.program_id} onValueChange={(value) => setInvitationData({ ...invitationData, program_id: value })}>
                      <SelectTrigger id="invite-program">
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
                  <Button onClick={handleSendInvitation} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation Email
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Invitation Sent!</span>
                    </div>
                    <p className="text-sm text-green-700">
                      An email invitation has been sent to {invitationData.email}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Invitation Link</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={invitationLink} 
                        readOnly 
                        className="text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={copyToClipboard}
                        className="min-w-[80px]"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      You can also copy and share this link directly
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={resetInvitationForm} 
                      variant="outline" 
                      className="flex-1"
                    >
                      Send Another
                    </Button>
                    <Button 
                      onClick={() => setIsInvitationDialogOpen(false)} 
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customers.map((customer) => (
                <div key={customer.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{customer.name}</h4>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">
                        {customer.active_programs} Active Programs
                      </Badge>
                      <Badge variant="outline">
                        ${customer.total_spent}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Program Details */}
                  <div className="mb-3">
                    <h5 className="font-medium text-sm text-gray-700 mb-2">Enrolled Programs:</h5>
                    {customer.enrolled_programs && customer.enrolled_programs.length > 0 ? (
                      <div className="space-y-2">
                        {customer.enrolled_programs.map((program) => (
                          <div key={program.id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-l-black-500">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h6 className="font-medium text-gray-900">{program.name}</h6>
                                  <Badge 
                                    variant={program.enrollment_status === 'active' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {program.enrollment_status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                                <div className="grid grid-cols-4 gap-3 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{program.duration_weeks}w</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>${program.price}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Target className="h-3 w-3" />
                                    <span>{program.completed_milestones}/{program.milestones_count}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(program.enrolled_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Find the program in the programs list and expand it
                                  const programIndex = programs.findIndex(p => p.id === program.id)
                                  if (programIndex !== -1) {
                                    setExpandedPrograms(new Set([program.id]))
                                    // Switch to programs section
                                    setActiveSection("programs")
                                  }
                                }}
                                className="h-7 text-xs"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No programs enrolled</div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm border-t pt-3">
                    <div>
                      <span className="font-medium">Total Programs:</span> {customer.total_programs}
                    </div>
                    <div>
                      <span className="font-medium">Active Programs:</span> {customer.active_programs}
                    </div>
                    <div>
                      <span className="font-medium">Completed Milestones:</span> {customer.completed_milestones}
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

  // Default dashboard view (overview)
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Your coaching business overview</p>
      </div>


      </div>

            {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
                      <div>
              <p className="text-sm font-medium text-gray-600 mb-1 group-hover:text-gray-700 transition-colors duration-300">Total Programs</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-black transition-colors duration-300">{stats.totalPrograms}</p>
                      </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all duration-300">
              <BookOpen className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors duration-300" />
            </div>
          </div>
          <div className="flex items-center text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
            <svg className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span>+12.5%</span>
          </div>
        </div>

        <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1 group-hover:text-gray-700 transition-colors duration-300">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-black transition-colors duration-300">{stats.totalCustomers}</p>
                      </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all duration-300">
              <Users className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors duration-300" />
                    </div>
          </div>
          <div className="flex items-center text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
            <svg className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span>+8.2%</span>
          </div>
        </div>

        <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
                      <div>
              <p className="text-sm font-medium text-gray-600 mb-1 group-hover:text-gray-700 transition-colors duration-300">Total Milestones</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-black transition-colors duration-300">{stats.totalMilestones}</p>
                      </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all duration-300">
              <Target className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors duration-300" />
            </div>
          </div>
          <div className="flex items-center text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
            <svg className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span>+18.2%</span>
          </div>
        </div>

        <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
                      <div>
              <p className="text-sm font-medium text-gray-600 mb-1 group-hover:text-gray-700 transition-colors duration-300">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-black transition-colors duration-300">${stats.totalRevenue}</p>
                      </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all duration-300">
              <DollarSign className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors duration-300" />
            </div>
          </div>
          <div className="flex items-center text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
            <svg className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span>+23.1%</span>
          </div>
        </div>
      </div>

            {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Programs Section */}
        <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all duration-300">
                <BookOpen className="w-5 h-5 text-gray-700 group-hover:text-black transition-colors duration-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-black transition-colors duration-300">Current Programs</h2>
            </div>
            <button 
              onClick={() => setActiveSection('programs')}
              className="px-4 py-2 text-gray-700 hover:text-white text-sm font-medium rounded-lg transition-all duration-300 hover:bg-gray-900 border border-gray-300 hover:border-gray-900 hover:scale-105"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {programs.slice(0, 3).map((program, index) => (
              <div 
                key={program.id} 
                className="group/item flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg hover:bg-white hover:border-gray-300 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover/item:bg-gray-200 group-hover/item:scale-110 transition-all duration-300">
                  <BookOpen className="w-6 h-6 text-gray-700 group-hover/item:text-black transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover/item:text-black transition-colors duration-300">{program.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center space-x-1 group-hover/item:text-gray-700 transition-colors duration-300">
                    <Users className="w-4 h-4" />
                    <span>{program.members_count || 0} members</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 group-hover/item:text-black transition-colors duration-300">${program.price}</div>
                  <div className="flex items-center space-x-1 text-xs text-gray-600 group-hover/item:text-gray-700 transition-colors duration-300">
                    <div className="w-2 h-2 bg-gray-500 rounded-full group-hover/item:bg-gray-700 transition-colors duration-300"></div>
                    <span>Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

                {/* Revenue Overview Section */}
        <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all duration-300">
                <TrendingUp className="w-5 h-5 text-gray-700 group-hover:text-black transition-colors duration-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-black transition-colors duration-300">Revenue Overview</h2>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-900 text-white text-sm rounded-lg hover:scale-105 transition-transform duration-300">Weekly</button>
              <button className="px-3 py-1 bg-white text-gray-600 text-sm rounded-lg border hover:bg-gray-50 hover:border-gray-300 transition-all duration-300">Monthly</button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                      <div>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-black transition-colors duration-300">${stats.monthlyRevenue}</p>
                <p className="text-sm text-gray-600 flex items-center space-x-1 group-hover:text-gray-700 transition-colors duration-300">
                  <Calendar className="w-4 h-4" />
                  <span>This month</span>
                </p>
                      </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  <span>+12.5%</span>
                    </div>
                <div className="text-xs text-gray-500">vs last month</div>
              </div>
            </div>
            {/* Chart */}
            <div className="h-32 bg-gray-50 rounded-xl p-4 border border-gray-200 group-hover:bg-gray-100 group-hover:border-gray-300 transition-all duration-300">
              <div className="flex items-end justify-around h-full space-x-2">
                {[20, 35, 25, 45, 30, 50, 40].map((height, index) => (
                  <div
                    key={index}
                    className="group/bar w-8 bg-gray-700 rounded-t-lg transition-all duration-300 hover:bg-gray-900 hover:scale-110"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      ${Math.round(height * 2.5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* Programs Performance Section */}
      <div className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:scale-[1.01]">
        <div className="flex items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-110 transition-all duration-300">
              <BarChart3 className="w-5 h-5 text-gray-700 group-hover:text-black transition-colors duration-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-black transition-colors duration-300">Programs Performance</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Program</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Members</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program, index) => (
                <tr 
                  key={program.id} 
                  className="group/row border-b border-gray-100 hover:bg-gray-50 transition-all duration-300"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover/row:bg-gray-200 group-hover/row:scale-110 transition-all duration-300">
                        <BookOpen className="w-5 h-5 text-gray-700 group-hover/row:text-black transition-colors duration-300" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover/row:text-black transition-colors duration-300">{program.name}</div>
                        <div className="text-sm text-gray-600 flex items-center space-x-1 group-hover/row:text-gray-700 transition-colors duration-300">
                          <Target className="w-4 h-4" />
                          <span>{program.milestones_count || 0} milestones</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500 group-hover/row:text-gray-700 transition-colors duration-300" />
                      <span className="text-gray-900 font-medium group-hover/row:text-black transition-colors duration-300">{program.members_count || 0}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500 group-hover/row:text-gray-700 transition-colors duration-300" />
                      <span className="text-gray-900 font-bold group-hover/row:text-black transition-colors duration-300">${program.price * (program.members_count || 0)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium flex items-center space-x-1 w-fit ${
                      program.is_active 
                        ? 'bg-gray-100 text-gray-800 border border-gray-200 group-hover/row:bg-gray-200 group-hover/row:border-gray-300' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200 group-hover/row:bg-gray-200 group-hover/row:border-gray-300'
                    } transition-all duration-300`}>
                      <div className={`w-2 h-2 rounded-full ${program.is_active ? 'bg-gray-700' : 'bg-gray-500'} group-hover/row:bg-gray-900 transition-colors duration-300`}></div>
                      <span>{program.is_active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button 
                      onClick={() => setActiveSection('programs')}
                      className="px-4 py-2 text-gray-700 hover:text-white text-sm font-medium rounded-lg transition-all duration-300 hover:bg-gray-900 border border-gray-300 hover:border-gray-900 hover:scale-105"
                    >
                      <span className="flex items-center space-x-1">
                        <span>View Details</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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




>>>>>>> signup-issue-resolved

export function CoachDashboard({ coachId }: { coachId: string }) {
  return (
    <div className="space-y-6">
      {/* Empty Dashboard */}
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coach Dashboard</h2>
        <p className="text-gray-600">Welcome to your coaching dashboard</p>
      </div>
>>>>>>> admin-side-updated
    </div>
  )
} 