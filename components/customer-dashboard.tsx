"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, BookOpen, Target, Calendar, CheckCircle, Clock, Award } from "lucide-react"
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

interface Milestone {
  id: string
  title: string
  description: string
  order_index: number
  completed: boolean
  completed_at?: string
  program_name: string
}

interface CustomerStats {
  totalPrograms: number
  completedMilestones: number
  totalMilestones: number
  totalSpent: number
  completionRate: number
}

export function CustomerDashboard({ customerId }: { customerId: string }) {
  const { toast } = useToast()
  const [coach, setCoach] = useState<Coach | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    totalPrograms: 0,
    completedMilestones: 0,
    totalMilestones: 0,
    totalSpent: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

      if (programsResponse.ok) {
        const programsData = await programsResponse.json()
        if (programsData.programs) {
          setPrograms(programsData.programs)
        } else {
          setPrograms([])
        }
      }

      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json()
        if (milestonesData.milestones) {
          setMilestones(milestonesData.milestones)
        } else {
          setMilestones([])
        }
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats)
        } else {
          console.error('Invalid stats response:', statsData)
          // Set default stats if the response is invalid
          setStats({
            totalPrograms: 0,
            completedMilestones: 0,
            totalMilestones: 0,
            totalSpent: 0,
            completionRate: 0
          })
        }
      } else {
        console.error('Stats response not ok:', statsResponse.status)
        // Set default stats if the response fails
        setStats({
          totalPrograms: 0,
          completedMilestones: 0,
          totalMilestones: 0,
          totalSpent: 0,
          completionRate: 0
        })
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = (milestone: Milestone) => {
    setConfirmMilestone(milestone)
  }

  const confirmMarkComplete = async () => {
    if (!confirmMilestone) return
    
    await markComplete(confirmMilestone.id)
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
            m.id === milestoneId 
              ? { ...m, completed: true, completed_at: new Date().toISOString() }
              : m
          ))
          
          // Refresh stats to update completion rate
          fetchCustomerData()
          
          toast({
            title: 'Milestone marked complete!',
            description: `"${milestones.find(m => m.id === milestoneId)?.title}" has been marked as complete.`,
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
        setError('Failed to mark milestone complete')
        toast({
          title: 'Marking milestone failed',
          description: errorData.error || `Failed to mark milestone complete: ${response.status}`,
          variant: 'destructive',
        })
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

  const statsCards = [
    {
      title: "Enrolled Programs",
      value: (stats.totalPrograms || 0).toString(),
      change: "Active programs",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Completed Milestones",
      value: (stats.completedMilestones || 0).toString(),
      change: `of ${stats.totalMilestones || 0} total`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Completion Rate",
      value: (stats.completionRate || 0) + "%",
      change: "Overall progress",
      icon: Target,
      color: "text-purple-600",
    },
    {
      title: "Total Investment",
      value: "$" + (stats.totalSpent || 0).toLocaleString(),
      change: "In your growth",
      icon: Award,
      color: "text-emerald-600",
    },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">Error loading dashboard</p>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => {
              setError(null)
              fetchCustomerData()
            }} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
              <Button variant="outline">Contact Coach</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">My Programs</TabsTrigger>
          <TabsTrigger value="milestones">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>Your journey through all programs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Milestone Completion</span>
                    <span className="font-medium">{stats.completedMilestones || 0}/{stats.totalMilestones || 0}</span>
                  </div>
                  <Progress value={stats.completionRate || 0} className="h-2" />
                  <div className="text-xs text-gray-500">{stats.completionRate || 0}% complete</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Programs Enrolled</span>
                    <span className="font-medium">{stats.totalPrograms || 0}</span>
                  </div>
                  <Progress value={((stats.totalPrograms || 0) / 3) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest milestones and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const completedMilestones = milestones
                      .filter(m => m.completed && m.completed_at)
                      .sort((a, b) => {
                        const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
                        const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
                        return dateB - dateA
                      })
                      .slice(0, 5)
                    
                    if (completedMilestones.length === 0) {
                      return (
                        <div className="text-center text-gray-500 py-4">
                          No completed milestones yet
                        </div>
                      )
                    }
                    
                    return completedMilestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{milestone.title}</p>
                          <p className="text-xs text-gray-600">{milestone.program_name}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {milestone.completed_at ? new Date(milestone.completed_at).toLocaleDateString() : ''}
                        </Badge>
                      </div>
                    ))
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Coaching Programs</CardTitle>
              <CardDescription>Programs you're enrolled in and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.length > 0 ? (
                    programs.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.name}</TableCell>
                        <TableCell>{program.duration_weeks} weeks</TableCell>
                        <TableCell>{program.enrolled_at ? new Date(program.enrolled_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                            {program.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={
                                (() => {
                                  const totalMilestones = milestones.filter(m => m.program_name === program.name).length
                                  const completedMilestones = milestones.filter(m => m.program_name === program.name && m.completed).length
                                  return totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
                                })()
                              } 
                              className="w-20 h-2" 
                            />
                            <span className="text-sm">
                              {milestones.filter(m => m.program_name === program.name && m.completed).length}/
                              {milestones.filter(m => m.program_name === program.name).length}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Continue
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No programs enrolled yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Milestone Progress</CardTitle>
              <CardDescription>Track your progress through each program</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.length > 0 ? (
                    milestones.map((milestone) => (
                      <TableRow key={milestone.id}>
                        <TableCell className="font-medium">{milestone.title}</TableCell>
                        <TableCell>{milestone.program_name}</TableCell>
                        <TableCell>
                          <Badge variant={milestone.completed ? 'default' : 'secondary'}>
                            {milestone.completed ? 'Completed' : 'In Progress'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {milestone.completed && milestone.completed_at ? (
                            <span className="text-green-600">
                              {new Date(milestone.completed_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {milestone.completed ? (
                            <Button variant="outline" size="sm" disabled>
                              Completed
                            </Button>
                          ) : (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleMarkComplete(milestone)}
                              disabled={updatingMilestones.has(milestone.id)}
                            >
                              {updatingMilestones.has(milestone.id) ? 'Updating...' : 'Mark Complete'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No milestones found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                 disabled={updatingMilestones.has(confirmMilestone.id)}
               >
                 {updatingMilestones.has(confirmMilestone.id) ? 'Updating...' : 'Mark Complete'}
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
       )}
    </div>
  )
} 