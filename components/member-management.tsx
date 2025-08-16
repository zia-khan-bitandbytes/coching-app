"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Trash2, Edit, Mail, Copy, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"

const members = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    program: "Business Growth Program",
    stage: "Milestone 3",
    status: "Active",
    joinDate: "2024-01-15",
    progress: 60,
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike@example.com",
    program: "Leadership Mastery",
    stage: "Milestone 2",
    status: "Active",
    joinDate: "2024-02-01",
    progress: 40,
  },
  {
    id: 3,
    name: "Emma Davis",
    email: "emma@example.com",
    program: "Sales Excellence",
    stage: "Milestone 1",
    status: "Active",
    joinDate: "2024-02-15",
    progress: 20,
  },
  {
    id: 4,
    name: "John Smith",
    email: "john@example.com",
    program: "Business Growth Program",
    stage: "Completed",
    status: "Graduated",
    joinDate: "2023-12-01",
    progress: 100,
  },
]

export function MemberManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [invitationData, setInvitationData] = useState<{
    email: string
    name: string
    program: string
  }>({
    email: "",
    name: "",
    program: ""
  })
  const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false)
  const [invitationLink, setInvitationLink] = useState("")
  const [showInvitationLink, setShowInvitationLink] = useState(false)
  const [copied, setCopied] = useState(false)

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>
      case "Graduated":
        return <Badge className="bg-blue-100 text-blue-700">Graduated</Badge>
      case "Paused":
        return <Badge variant="secondary">Paused</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleSendInvitation = async () => {
    if (!invitationData.email || !invitationData.name || !invitationData.program) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    try {
      // For demo purposes, we'll use a mock coach ID
      // In a real app, you'd get this from the current user context
      const coachId = "1" // This should come from authentication context
      
      const response = await fetch(`/api/coach/${coachId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: invitationData.email,
          name: invitationData.name,
          program_id: invitationData.program
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
    setInvitationData({ email: "", name: "", program: "" })
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
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Full Name</Label>
                  <Input 
                    id="invite-name" 
                    placeholder="Enter full name"
                    value={invitationData.name}
                    onChange={(e) => setInvitationData({ ...invitationData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input 
                    id="invite-email" 
                    type="email" 
                    placeholder="Enter email address"
                    value={invitationData.email}
                    onChange={(e) => setInvitationData({ ...invitationData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-program">Program</Label>
                  <Select value={invitationData.program} onValueChange={(value) => setInvitationData({ ...invitationData, program: value })}>
                    <SelectTrigger id="invite-program">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Business Growth Program</SelectItem>
                      <SelectItem value="2">Leadership Mastery</SelectItem>
                      <SelectItem value="3">Sales Excellence</SelectItem>
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

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>All Members ({filteredMembers.length})</CardTitle>
          <CardDescription>Overview of all coaching clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {member.program}
                      </Badge>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{member.stage}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{member.progress}% Complete</div>
                    <div className="text-xs text-gray-500">Joined {member.joinDate}</div>
                  </div>
                  {getStatusBadge(member.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Member
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
