"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, CheckCircle, DollarSign, Calendar, Mail, Check, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Customer {
  id: string
  name: string
  email: string
  enrolled_programs: {
    id: string
    name: string
    description: string
    duration_weeks: number
    price: number
    is_active: boolean
    enrollment_status: string
    enrolled_at: string
    milestones_count: number
    completed_milestones: number
  }[]
  total_programs: number
  active_programs: number
  completed_milestones: number
  total_spent: number
  last_activity: string
}

export function MemberManagement() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [coachId, setCoachId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    // Get coach ID from localStorage
    const userData = localStorage.getItem("user")
    console.log('MemberManagement: userData from localStorage:', userData)
    if (userData) {
      const user = JSON.parse(userData)
      console.log('MemberManagement: parsed user:', user)
      console.log('MemberManagement: user keys:', Object.keys(user))
      console.log('MemberManagement: user.role:', user.role)
      console.log('MemberManagement: user.id:', user.id)
      console.log('MemberManagement: user.coach_id:', user.coach_id)
      
      // Check if user is a coach and has coach_id
      if (user.role === 'coach') {
        if (user.coach_id) {
          console.log('MemberManagement: setting coachId:', user.coach_id)
          setCoachId(user.coach_id)
          fetchCustomers(user.coach_id)
        } else {
          console.log('MemberManagement: coach user but no coach_id found')
          console.log('MemberManagement: trying to use user.id as coach_id:', user.id)
          setCoachId(user.id)
          fetchCustomers(user.id)
        }
      } else {
        console.log('MemberManagement: user is not a coach, role:', user.role)
        setIsLoading(false)
      }
    } else {
      console.log('MemberManagement: no user data in localStorage')
      setIsLoading(false)
    }
  }, [])

  // Debug: Log when component renders
  console.log('MemberManagement component rendered with:', {
    customers: customers.length,
    coachId,
    isLoading
  })

  const fetchCustomers = async (coachId: string) => {
    try {
      console.log('MemberManagement: fetching customers for coachId:', coachId)
      setIsLoading(true)
      const customersRes = await fetch(`/api/coach/${coachId}/customers`)
      console.log('MemberManagement: customers response status:', customersRes.status)
      const customersData = await customersRes.json()
      console.log('MemberManagement: customers response data:', customersData)
      if (customersData.success) {
        console.log('MemberManagement: setting customers:', customersData.customers)
        console.log('=== COACH CUSTOMERS SUMMARY ===')
        console.log(`Total customers: ${customersData.customers.length}`)
        customersData.customers.forEach((customer: Customer, index: number) => {
          console.log(`\n${index + 1}. ${customer.name} (${customer.email})`)
          console.log(`   - Total programs: ${customer.total_programs}`)
          console.log(`   - Active programs: ${customer.active_programs}`)
          console.log(`   - Completed milestones: ${customer.completed_milestones}`)
          console.log(`   - Total spent: $${customer.total_spent}`)
          console.log(`   - Last activity: ${customer.last_activity}`)
          if (customer.enrolled_programs.length > 0) {
            console.log(`   - Enrolled programs:`)
            customer.enrolled_programs.forEach((program: any) => {
              console.log(`     * ${program.name} (${program.enrollment_status})`)
            })
          }
        })
        console.log('=== END SUMMARY ===')
        setCustomers(customersData.customers)
      } else {
        console.log('MemberManagement: API returned success: false, error:', customersData.error)
        toast({
          title: "Error",
          description: customersData.error || "Failed to fetch customers",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('MemberManagement: Error fetching customers:', error)
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-600 mt-1">Manage your coaching clients and their progress</p>
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
                      {/* Programs will be loaded from the roadmap editor */}
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
          <CardTitle>Your Customers</CardTitle>
          <CardDescription>Customers enrolled in your programs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading customers...</p>
              </div>
            </div>
          ) : customers.length > 0 ? (
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
                          <div key={program.id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-l-blue-500">
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
                                    <CheckCircle className="h-3 w-3" />
                                    <span>{program.completed_milestones}/{program.milestones_count}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(program.enrolled_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
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
          ) : !coachId ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Coach Profile Not Found</h3>
              <p className="text-gray-600 mb-4">Unable to load your coach profile. Please contact support.</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
              <p className="text-gray-600 mb-4">You haven't enrolled any customers in your programs yet.</p>
              <Button onClick={() => setIsInvitationDialogOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Your First Invitation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
