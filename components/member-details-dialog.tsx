"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  FileText, 
  Download, 
  Target, 
  Users, 
  DollarSign,
  TrendingUp,
  Award,
  BookOpen,
  Zap,
  User
} from "lucide-react"

interface CustomerDetails {
  id: number
  name: string
  email: string
  enrolled_programs: {
    id: number
    name: string
    description: string
    price: number
    enrollment_status: string
    enrolled_at: string
    milestones_count: number
    completed_milestones: number
    milestones: MilestoneDetail[]
  }[]
  total_programs: number
  active_programs: number
  completed_milestones: number
  total_spent: number
  last_activity: string
}

interface MilestoneDetail {
  id: number
  title: string
  description: string
  goal_days: number
  order_index: number
  status: 'completed' | 'in-progress' | 'upcoming'
  started_at?: string
  completed_at?: string
  completion_days?: number
  tasks: TaskDetail[]
}

interface TaskDetail {
  id: number
  title: string
  description: string
  completed: boolean
  completed_at?: string
  requires_upload: boolean
  files: {
    id: string
    filename: string
    original_name: string
    file_size: number
    uploaded_at: string
    url: string
  }[]
}

interface MemberDetailsDialogProps {
  customer: CustomerDetails | null
  isOpen: boolean
  onClose: () => void
  coachId: string
}

export function MemberDetailsDialog({ customer, isOpen, onClose, coachId }: MemberDetailsDialogProps) {
  console.log('MemberDetailsDialog render - customer:', customer, 'isOpen:', isOpen)
  
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set())

  // Debug logging
  useEffect(() => {
    if (customer) {
      console.log('MemberDetailsDialog: Customer data received:', customer)
      console.log('MemberDetailsDialog: Programs:', customer.enrolled_programs)
      console.log('MemberDetailsDialog: First program milestones:', customer.enrolled_programs[0]?.milestones)
    }
  }, [customer])

  const calculateProgramProgress = (program: any) => {
    if (!program || !program.milestones_count || program.milestones_count === 0) return 0
    return Math.round((program.completed_milestones / program.milestones_count) * 100)
  }

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'upcoming': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in-progress': return <Clock className="h-4 w-4" />
      case 'upcoming': return <Target className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  // Safety check for customer data
  if (!customer) {
    console.error('MemberDetailsDialog: No customer data provided')
    return null
  }
  
  if (!customer.enrolled_programs) {
    console.error('MemberDetailsDialog: Customer missing enrolled_programs:', customer)
    return null
  }

  const toggleMilestoneExpansion = (milestoneId: number) => {
    const newExpanded = new Set(expandedMilestones)
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId)
    } else {
      newExpanded.add(milestoneId)
    }
    setExpandedMilestones(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Additional safety check - don't render if no customer data
  if (!customer || !customer.enrolled_programs) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            {customer.name} - Member Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive view of {customer.name}'s progress, milestones, and tasks across all enrolled programs
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Customer Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{customer.total_programs}</div>
                    <div className="text-sm text-blue-600">Total Programs</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{customer.active_programs}</div>
                    <div className="text-sm text-green-600">Active Programs</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{customer.completed_milestones}</div>
                    <div className="text-sm text-purple-600">Completed Milestones</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">${customer.total_spent}</div>
                    <div className="text-sm text-orange-600">Total Spent</div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Last Activity</span>
                  </div>
                  <p className="text-gray-700">{formatDate(customer.last_activity)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Program Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Program Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.enrolled_programs.map((program) => (
                    <div key={program.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{program.name}</h4>
                          <p className="text-gray-600">{program.description}</p>
                        </div>
                        <Badge variant={program.enrollment_status === 'active' ? 'default' : 'secondary'}>
                          {program.enrollment_status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">${program.price}</div>
                          <div className="text-sm text-gray-600">Price</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{program.completed_milestones}</div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{program.milestones_count}</div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{formatDate(program.enrolled_at)}</div>
                          <div className="text-sm text-gray-600">Enrolled</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{calculateProgramProgress(program)}%</span>
                        </div>
                        <Progress value={calculateProgramProgress(program)} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Milestone Details
                </CardTitle>
                <CardDescription>
                  Detailed view of all milestones across all programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.enrolled_programs.map((program) => (
                    <div key={program.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-3 text-blue-600">{program.name}</h4>
                      
                      {program.milestones && program.milestones.length > 0 ? (
                        <div className="space-y-3">
                          {program.milestones.map((milestone) => (
                            <div key={milestone.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                      #{milestone.order_index || 'N/A'}
                                    </span>
                                    <h5 className="font-medium">{milestone.title || 'Untitled Milestone'}</h5>
                                    <Badge className={getMilestoneStatusColor(milestone.status || 'upcoming')}>
                                      {getMilestoneStatusIcon(milestone.status || 'upcoming')}
                                      <span className="ml-1">{milestone.status || 'upcoming'}</span>
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{milestone.description || 'No description available'}</p>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="flex items-center gap-1">
                                      <Target className="h-3 w-3 text-blue-600" />
                                      <span>Goal: {milestone.goal_days || 30} days</span>
                                    </div>
                                    {milestone.started_at && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 text-green-600" />
                                        <span>Started: {formatDate(milestone.started_at)}</span>
                                      </div>
                                    )}
                                    {milestone.completed_at && (
                                      <div className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        <span>Completed: {formatDate(milestone.completed_at)}</span>
                                      </div>
                                    )}
                                    {milestone.completion_days && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-orange-600" />
                                        <span>Actual: {Math.round(milestone.completion_days)} days</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Badge className={getMilestoneStatusColor(milestone.status || 'upcoming')}>
                                        {milestone.status || 'upcoming'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleMilestoneExpansion(milestone.id)}
                                >
                                  {expandedMilestones.has(milestone.id) ? 'Hide Tasks' : 'Show Tasks'}
                                </Button>
                              </div>
                              
                              {/* Tasks Section */}
                              {expandedMilestones.has(milestone.id) && (
                                <div className="border-t pt-3 mt-3">
                                  <h6 className="font-medium mb-2 text-gray-700">Tasks</h6>
                                  <div className="space-y-2">
                                    {milestone.tasks && milestone.tasks.length > 0 ? (
                                      milestone.tasks.map((task) => (
                                        <div key={task.id} className="bg-white rounded-lg p-3 border">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <CheckCircle className={`h-4 w-4 ${task.completed ? 'text-green-600' : 'text-gray-400'}`} />
                                              <span className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                                {task.title || 'Untitled Task'}
                                              </span>
                                            </div>
                                            <Badge variant={task.completed ? 'default' : 'secondary'}>
                                              {task.completed ? 'Completed' : 'Pending'}
                                            </Badge>
                                          </div>
                                          
                                          <p className="text-sm text-gray-600 mb-2">{task.description || 'No description available'}</p>
                                          
                                          {/* Files Section */}
                                          {task.files && task.files.length > 0 && (
                                            <div className="space-y-2">
                                              <div className="text-sm font-medium text-gray-700">Attached Files:</div>
                                              {task.files.map((file) => (
                                                <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                                  <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm font-medium">{file.original_name || 'Unknown File'}</span>
                                                    <span className="text-xs text-gray-500">
                                                      ({formatFileSize(file.file_size || 0)})
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">
                                                      {file.uploaded_at ? formatDate(file.uploaded_at) : 'Unknown Date'}
                                                    </span>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => file.url ? window.open(file.url, '_blank') : null}
                                                      disabled={!file.url}
                                                    >
                                                      <Download className="h-3 w-3 mr-1" />
                                                      Download
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-sm text-gray-500 italic">No tasks for this milestone</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          No milestone data available for this program
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Task Overview
                </CardTitle>
                <CardDescription>
                  All tasks across all programs with completion status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.enrolled_programs.map((program) => (
                    <div key={program.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-lg mb-3 text-blue-600">{program.name}</h4>
                      
                      {program.milestones && program.milestones.length > 0 ? (
                        <div className="space-y-3">
                          {program.milestones.flatMap(milestone => 
                            milestone.tasks ? milestone.tasks.map(task => ({
                              ...task,
                              milestoneTitle: milestone.title,
                              programName: program.name
                            })) : []
                          ).map((task, index) => (
                            <div key={`${task.programName}-${task.milestoneTitle}-${index}`} className="bg-gray-50 rounded-lg p-4 border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className={`h-4 w-4 ${task.completed ? 'text-green-600' : 'text-gray-400'}`} />
                                  <span className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                    {task.title}
                                  </span>
                                </div>
                                <Badge variant={task.completed ? 'default' : 'secondary'}>
                                  {task.completed ? 'Completed' : 'Pending'}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Milestone:</span> {task.milestoneTitle} | 
                                <span className="font-medium ml-2">Program:</span> {task.programName}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                              
                              {task.completed_at && (
                                <div className="text-sm text-green-600 mb-2">
                                  Completed: {formatDate(task.completed_at)}
                                </div>
                              )}
                              
                              {/* Files Section */}
                              {task.files && task.files.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-700">Attached Files:</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {task.files.map((file) => (
                                      <div key={file.id} className="flex items-center justify-between bg-white rounded-lg p-2 border">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-blue-600" />
                                          <div>
                                            <div className="text-sm font-medium">{file.original_name}</div>
                                            <div className="text-xs text-gray-500">
                                              {formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(file.url, '_blank')}
                                        >
                                          <Download className="h-3 w-3 mr-1" />
                                          Download
                                        </Button>
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
                          No task data available for this program
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
                <CardDescription>
                  Detailed performance metrics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Completion Rate */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Completion Rates</h4>
                    {customer.enrolled_programs.map((program) => (
                      <div key={program.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{program.name}</span>
                          <span>{calculateProgramProgress(program)}%</span>
                        </div>
                        <Progress value={calculateProgramProgress(program)} className="h-2" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Time Analysis */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Time Analysis</h4>
                    <div className="space-y-3">
                      {customer.enrolled_programs.map((program) => {
                        if (!program.milestones) return null
                        
                        const completedMilestones = program.milestones.filter(m => m.status === 'completed')
                        const avgCompletionTime = completedMilestones.length > 0 
                          ? completedMilestones.reduce((sum, m) => sum + (m.completion_days || 0), 0) / completedMilestones.length
                          : 0
                        
                        return (
                          <div key={program.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium text-sm mb-2">{program.name}</div>
                            <div className="text-sm text-gray-600">
                              Avg completion time: {avgCompletionTime > 0 ? `${Math.round(avgCompletionTime)} days` : 'N/A'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
