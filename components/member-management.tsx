"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, CheckCircle, DollarSign, Calendar, Mail, Check, Copy, Eye, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MemberDetailsDialog } from "@/components/member-details-dialog"

interface Customer {
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
  }[]
  total_programs: number
  active_programs: number
  completed_milestones: number
  total_spent: number
  last_activity: string
}

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

interface Program {
  id: number
  name: string
  description: string
  price: number
  created_at: string
  members_count: number
  total_revenue: number
}

interface MemberManagementProps {
  coachId: string
}

export function MemberManagement({ coachId }: MemberManagementProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Details dialog states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [detailedCustomers, setDetailedCustomers] = useState<CustomerDetails[]>([])
  const [loadingCustomerId, setLoadingCustomerId] = useState<number | null>(null)

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
  const [isSendingInvitation, setIsSendingInvitation] = useState(false)
  const [emailError, setEmailError] = useState("")

  useEffect(() => {
    // Use the coachId prop directly
    if (coachId) {
      console.log('MemberManagement: using coachId prop:', coachId)
      fetchCustomers(coachId)
      fetchPrograms(coachId)
    } else {
      console.log('MemberManagement: no coachId provided')
      setIsLoading(false)
    }
  }, [coachId])

  // Debug: Log when component renders
  console.log('MemberManagement component rendered with:', {
    customers: customers.length,
    coachId,
    isLoading
  })

  const fetchPrograms = async (coachId: string) => {
    try {
      const response = await fetch(`/api/coach/${coachId}/programs`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPrograms(data.programs)
          
          // Auto-redirect to program creation if no programs exist
          if (data.programs.length === 0) {
            toast({
              title: "No Programs Found",
              description: "Redirecting you to create your first program...",
              variant: "default"
            })
            setTimeout(() => {
              router.push('/admin/roadmap-editor')
            }, 2000) // 2 second delay to show the toast
          }
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

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
    console.log('=== handleSendInvitation START ===');
    console.log('handleSendInvitation called with coachId:', coachId);
    console.log('Current invitation data:', invitationData);
    
    // Set loading state immediately
    setIsSendingInvitation(true);
    
    if (!coachId) {
      console.error('No coach ID available');
      setIsSendingInvitation(false);
      toast({
        title: "Error",
        description: "Coach profile not found. Please contact support.",
        variant: "destructive"
      })
      return
    }
    
    if (!invitationData.email || !invitationData.name || !invitationData.program_id) {
      console.error('Missing required fields:', invitationData);
      setIsSendingInvitation(false);
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    // Validate email format
    if (!validateEmail(invitationData.email)) {
      console.error('Invalid email format:', invitationData.email);
      setIsSendingInvitation(false);
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address (e.g., user@example.com)",
        variant: "destructive"
      })
      return
    }

    // Trim whitespace from email and name
    const cleanEmail = invitationData.email.trim()
    const cleanName = invitationData.name.trim()

    console.log('Cleaned data:', { cleanEmail, cleanName, program_id: invitationData.program_id });

    // Show loading state
    toast({
      title: "Sending invitation...",
      description: "Please wait while we send the invitation email.",
    })

    try {
      console.log('Preparing to send invitation with data:', {
        email: cleanEmail,
        name: cleanName,
        program_id: invitationData.program_id,
        coachId
      })

      const requestBody = {
        email: cleanEmail,
        name: cleanName,
        program_id: invitationData.program_id
      };
      
      console.log('Request body:', requestBody);
      console.log('Making fetch request to:', `/api/coach/${coachId}/invite`);

      const response = await fetch(`/api/coach/${coachId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('Invitation response status:', response.status);
      console.log('Invitation response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK. Status:', response.status, 'Error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json()
      console.log('Invitation response data:', data)

      if (data.success) {
        console.log('Invitation successful, setting invitation link:', data.invitationLink);
        setInvitationLink(data.invitationLink)
        setShowInvitationLink(true)
        toast({
          title: "Success",
          description: "Invitation email sent successfully!",
        })
      } else {
        console.error('Invitation failed:', data.error)
        toast({
          title: "Error",
          description: data.error || 'Failed to send invitation',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Invitation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast({
        title: "Error",
        description: `Failed to send invitation: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      console.log('=== handleSendInvitation END ===');
      setIsSendingInvitation(false);
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
    setEmailError("")
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError("")
      return false
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address (e.g., user@example.com)")
      return false
    }
    setEmailError("")
    return true
  }

  const handleViewDetails = async (customer: Customer) => {
    try {
      console.log('handleViewDetails called with customer:', customer)
      setLoadingCustomerId(customer.id)
      
      // Check if we already have detailed data for this customer
      const existingDetailed = detailedCustomers.find(c => c.id === customer.id)
      if (existingDetailed) {
        console.log('Using existing detailed data:', existingDetailed)
        setSelectedCustomer(existingDetailed)
        setIsDetailsDialogOpen(true)
        return
      }

      console.log('Fetching detailed data for customer ID:', customer.id)
      // Fetch detailed customer data including milestones and tasks
      const detailedResponse = await fetch(`/api/coach/${coachId}/customers/${customer.id}/details`)
      console.log('Detailed response status:', detailedResponse.status)
      
      if (detailedResponse.ok) {
        const detailedData = await detailedResponse.json()
        console.log('Detailed response data:', detailedData)
        
        if (detailedData.success) {
          const detailedCustomer = detailedData.customer
          console.log('Detailed customer data received:', detailedCustomer)
          setDetailedCustomers(prev => [...prev, detailedCustomer])
          setSelectedCustomer(detailedCustomer)
          setIsDetailsDialogOpen(true)
        } else {
          console.error('API returned success: false:', detailedData)
          toast({
            title: "Error",
            description: detailedData.error || "Failed to fetch customer details",
            variant: "destructive"
          })
        }
      } else {
        const errorText = await detailedResponse.text()
        console.error('API error response:', detailedResponse.status, errorText)
        toast({
          title: "Error",
          description: `Failed to fetch customer details (${detailedResponse.status})`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching customer details:', error)
      toast({
        title: "Error",
        description: "Failed to fetch customer details. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingCustomerId(null)
    }
  }

  // Show error if coach doesn't have a coach record
  if (!isLoading && !coachId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-2">Coach Profile Not Found</h2>
              <p className="text-muted-foreground mb-4">
                Your coach profile needs to be set up. This usually happens automatically when you sign up.
              </p>
              <p className="text-muted-foreground">
                Please contact support if this issue persists.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
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
                  {programs.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="mb-4">
                        <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-semibold mb-2">No Programs Available</h3>
                        <p className="text-muted-foreground mb-4">
                          You need to create a program before you can send invitations to customers.
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          setIsInvitationDialogOpen(false)
                          router.push('/admin/roadmap-editor')
                          toast({
                            title: "Redirecting to Program Editor",
                            description: "You'll be taken to the roadmap editor to create your first program.",
                            variant: "default"
                          })
                        }} 
                        className="w-full"
                      >
                        Create Program
                      </Button>
                    </div>
                  ) : (
                    <>
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
                          onChange={(e) => {
                            setInvitationData({ ...invitationData, email: e.target.value })
                            validateEmail(e.target.value)
                          }}
                          onBlur={(e) => validateEmail(e.target.value)}
                          placeholder="Enter customer email"
                          className={emailError ? "border-red-500" : ""}
                        />
                        {emailError && (
                          <p className="text-sm text-red-500 mt-1">{emailError}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="invite-program">Program</Label>
                        <Select value={invitationData.program_id} onValueChange={(value) => setInvitationData({ ...invitationData, program_id: value })}>
                          <SelectTrigger id="invite-program">
                            <SelectValue placeholder="Select a program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs.map((program) => (
                              <SelectItem key={program.id} value={program.id.toString()}>
                                {program.name} - ${program.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={() => {
                          console.log('Send invitation button clicked');
                          console.log('Current invitation data:', invitationData);
                          console.log('Coach ID:', coachId);
                          console.log('Programs available:', programs.length);
                          handleSendInvitation();
                        }} 
                        disabled={isSendingInvitation}
                        className="w-full"
                      >
                        {isSendingInvitation ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Invitation Email
                          </>
                        )}
                      </Button>
                    </>
                  )}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(customer)}
                        disabled={loadingCustomerId === customer.id}
                        className="flex items-center gap-2"
                      >
                        {loadingCustomerId === customer.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Details
                          </>
                        )}
                      </Button>
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
                                    <span>{new Date(program.enrolled_at).toLocaleDateString()}</span>
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
              <p className="text-gray-600 mb-4">
                {programs.length === 0 
                  ? "You need to create a program before you can invite customers."
                  : "You haven't enrolled any customers in your programs yet."
                }
              </p>
              <Button 
                onClick={() => {
                  if (programs.length === 0) {
                    router.push('/admin/roadmap-editor')
                    toast({
                      title: "Redirecting to Program Editor",
                      description: "You'll be taken to the roadmap editor to create your first program.",
                      variant: "default"
                    })
                  } else {
                    setIsInvitationDialogOpen(true)
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                {programs.length === 0 ? 'Create Program First' : 'Send Your First Invitation'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedCustomer && selectedCustomer.enrolled_programs && (
        <MemberDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          customer={selectedCustomer}
          coachId={coachId}
        />
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-xs">
          <div>Dialog Open: {isDetailsDialogOpen ? 'Yes' : 'No'}</div>
          <div>Selected Customer: {selectedCustomer ? `${selectedCustomer.name} (ID: ${selectedCustomer.id})` : 'None'}</div>
          <div>Coach ID: {coachId}</div>
        </div>
      )}
    </div>
  )
}
