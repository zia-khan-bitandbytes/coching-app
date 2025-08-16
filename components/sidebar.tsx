"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Map, BookOpen, HelpCircle, Users, X, LayoutDashboard } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast"
import { RoadmapView } from "./roadmap-view"
import { useDashboard } from "@/contexts/dashboard-context"

interface Message {
  id: string
  user: string
  text: string
  timestamp: string
  replies?: Message[]
  reactions?: { [emoji: string]: number }
}

const getNavigationItems = (userRole?: string) => {
  if (userRole === 'customer') {
    return [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
      { id: "roadmap", label: "Roadmap", icon: Map, active: false },
      { id: "resources", label: "Resources", icon: BookOpen, active: false },
      { id: "support", label: "Support", icon: HelpCircle, active: false },
      { id: "community", label: "A Community", icon: Users, active: false },
    ]
  }
  
  if (userRole === 'coach') {
    return [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
      { id: "programs", label: "Programs", icon: BookOpen, active: false },
      { id: "customers", label: "Customers", icon: Users, active: false },
      { id: "roadmap", label: "Roadmap", icon: Map, active: false },
      { id: "resources", label: "Resources", icon: BookOpen, active: false },
      { id: "support", label: "Support", icon: HelpCircle, active: false },
    ]
  }
  
  return [
    { id: "roadmap", label: "Roadmap", icon: Map, active: true },
    { id: "resources", label: "Resources", icon: BookOpen, active: false },
    { id: "support", label: "Support", icon: HelpCircle, active: false },
    { id: "community", label: "A Community", icon: Users, active: false },
  ]
}

export function Sidebar() {
  const { activeSection, setActiveSection } = useDashboard()
  const [activeItem, setActiveItem] = useState("roadmap")
  const [isCommunityOpen, setIsCommunityOpen] = useState(false)
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setUser(user)
      // Set default active item based on user role
      if (user.role === 'customer' || user.role === 'coach') {
        setActiveItem("dashboard")
      } else {
        setActiveItem("roadmap")
      }
    }
  }, [])

  useEffect(() => {
    // Fetch messages when community modal is open
    if (isCommunityOpen) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [isCommunityOpen])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/community/messages')
      const data = await response.json()
      if (response.ok) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !user) return
    setLoading(true)
    
    try {
      const response = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          userId: user.id,
          parentId: replyTo
        })
      })
      
      const data = await response.json()
      if (response.ok) {
        setInput("")
        setReplyTo(null)
        showSuccessToast('Message sent!')
        fetchMessages()
      } else {
        showErrorToast(data.error || 'Failed to send message')
      }
    } catch (error) {
      showErrorToast('Failed to send message')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleReact = async (msgId: string, emoji: string) => {
    if (!user) return
    
    try {
      const response = await fetch('/api/community/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msgId,
          userId: user.id,
          emoji
        })
      })
      
      const data = await response.json()
      if (response.ok) {
        setMessages(msgs => 
          msgs.map(msg => {
            if (msg.id === msgId) {
              return { ...msg, reactions: { ...msg.reactions, [emoji]: data.count } }
            }
            if (msg.replies) {
              const updatedReplies = msg.replies.map(reply => 
                reply.id === msgId 
                  ? { ...reply, reactions: { ...reply.reactions, [emoji]: data.count } }
                  : reply
              )
              return { ...msg, replies: updatedReplies }
            }
            return msg
          })
        )
      }
    } catch (error) {
      showErrorToast('Failed to update reaction')
    }
  }

  const handleReply = (msgId: string) => {
    setReplyTo(msgId)
    inputRef.current?.focus()
  }

  const handleCommunityClick = () => {
    setIsCommunityOpen(true)
  }

  const handleRoadmapClick = () => {
    setIsRoadmapOpen(true)
  }

  const handleCloseCommunity = () => {
    setIsCommunityOpen(false)
    setReplyTo(null)
    setInput("")
  }

  const handleCloseRoadmap = () => {
    setIsRoadmapOpen(false)
  }

  const handleDashboardClick = () => {
    // For customers, clicking dashboard should show the main dashboard content
    // This is already handled by the main dashboard layout
    setActiveItem("dashboard")
    setActiveSection("dashboard")
  }

  const handleProgramsClick = () => {
    // For coaches, clicking programs should show the programs content
    setActiveItem("programs")
    setActiveSection("programs")
  }

  const handleCustomersClick = () => {
    // For coaches, clicking customers should show the customers content
    setActiveItem("customers")
    setActiveSection("customers")
  }

  // Check if user is customer or coach
  const isCustomer = user?.role === 'customer'
  const isCoach = user?.role === 'coach'

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 p-6">
        <nav className="space-y-2">
          {getNavigationItems(user?.role).map((item) => {
            const Icon = item.icon
            
            // Only show Roadmap and Community for customers
            if (!isCustomer && (item.id === "roadmap" || item.id === "community")) {
              return null
            }
            
            // Show dashboard for both customers and coaches
            if (item.id === "dashboard" && !isCustomer && !isCoach) {
              return null
            }
            
            // Show programs only for coaches
            if (item.id === "programs" && !isCoach) {
              return null
            }
            
            // Show customers only for coaches
            if (item.id === "customers" && !isCoach) {
              return null
            }
            
            return (
              <Button
                key={item.id}
                variant={activeItem === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-left",
                  activeItem === item.id && "bg-blue-50 text-blue-700",
                )}
                onClick={() => {
                  if (item.id === "community") {
                    handleCommunityClick()
                  } else if (item.id === "roadmap") {
                    handleRoadmapClick()
                  } else if (item.id === "dashboard") {
                    handleDashboardClick()
                  } else if (item.id === "programs") {
                    handleProgramsClick()
                  } else if (item.id === "customers") {
                    handleCustomersClick()
                  } else {
                    setActiveItem(item.id)
                  }
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </aside>

      {/* Community Chat Modal - Only for customers */}
      {isCustomer && (
        <Dialog open={isCommunityOpen} onOpenChange={setIsCommunityOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Community Chat</span>
                <Button variant="ghost" size="sm" onClick={handleCloseCommunity}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col h-[60vh]">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages yet. Be the first to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{msg.user}</span>
                        <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="ml-2 my-1">{msg.text}</div>
                      <div className="flex gap-2 ml-2">
                        <Button size="sm" variant="ghost" onClick={() => handleReact(msg.id, "👍")}>
                          👍 {msg.reactions?.["👍"] || 0}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleReact(msg.id, "❤️")}>
                          ❤️ {msg.reactions?.["❤️"] || 0}
                        </Button>
                        <Button size="sm" variant="link" onClick={() => handleReply(msg.id)}>
                          Reply
                        </Button>
                      </div>
                      
                      {msg.replies && msg.replies.length > 0 && (
                        <div className="ml-6 mt-2 space-y-2">
                          {msg.replies.map((reply) => (
                            <div key={reply.id} className="border-l-2 pl-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{reply.user}</span>
                                <span className="text-xs text-gray-400">{new Date(reply.timestamp).toLocaleString()}</span>
                              </div>
                              <div className="ml-2 my-1">{reply.text}</div>
                              <div className="flex gap-2 ml-2">
                                <Button size="sm" variant="ghost" onClick={() => handleReact(reply.id, "👍")}>
                                  👍 {reply.reactions?.["👍"] || 0}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleReact(reply.id, "❤️")}>
                                  ❤️ {reply.reactions?.["❤️"] || 0}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={replyTo ? "Reply to message..." : "Type your message..."}
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  {loading ? "Sending..." : replyTo ? "Reply" : "Send"}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Roadmap Modal - Only for customers */}
      {isCustomer && (
        <Dialog open={isRoadmapOpen} onOpenChange={setIsRoadmapOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Your Learning Roadmap</span>
                <Button variant="ghost" size="sm" onClick={handleCloseRoadmap}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="overflow-y-auto max-h-[80vh]">
              <RoadmapView />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
