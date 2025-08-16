"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Map, BookOpen, HelpCircle, Users, BarChart3 } from "lucide-react"

const getNavigationItems = (userRole?: string) => {
  if (userRole === 'customer') {
    return [
      { id: "roadmap", label: "Roadmap", icon: Map, active: true },
      { id: "resources", label: "Resources", icon: BookOpen, active: false },
      { id: "support", label: "Support", icon: HelpCircle, active: false },
      { id: "community", label: "A Community", icon: Users, active: false },
    ]
  }
  
  if (userRole === 'coach') {
    return [
      { id: "dashboard", label: "Dashboard", icon: BarChart3, active: true },
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
  const [activeItem, setActiveItem] = useState("dashboard")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setUser(user)
      // Set default active item based on user role
      if (user.role === 'customer') {
        // Customers only see roadmap view
        setActiveItem("roadmap")
        localStorage.setItem('customerActiveView', 'roadmap')
      } else if (user.role === 'coach') {
        // Coaches see dashboard by default
        setActiveItem("dashboard")
      } else {
        setActiveItem("roadmap")
      }
    }
  }, [])

  const handleRoadmapClick = () => {
    console.log('Roadmap clicked, isCustomer:', isCustomer)
    // For customers, clicking roadmap should show the roadmap component
    if (isCustomer) {
      // Show roadmap by setting active item
      setActiveItem("roadmap")
      // Store in localStorage to persist the selection
      localStorage.setItem('customerActiveView', 'roadmap')
      // Emit a custom event to notify the parent component
      window.dispatchEvent(new CustomEvent('sidebarViewChanged', { 
        detail: { view: 'roadmap' } 
      }))
    }
  }

  const handleDashboardClick = () => {
    if (user?.role === 'coach') {
      setActiveItem("dashboard")
      // Emit a custom event to notify the parent component
      window.dispatchEvent(new CustomEvent('sidebarViewChanged', { 
        detail: { view: 'dashboard' } 
      }))
    }
  }

  const handleCommunityClick = () => {
    // Community functionality removed - button remains but does nothing
    console.log('Community button clicked - functionality removed')
  }

  const handleProgramsClick = () => {
    setActiveItem("programs")
    // Communicate with coach dashboard
    localStorage.setItem("activeSection", "programs")
    // Trigger a custom event to notify the dashboard
    window.dispatchEvent(new CustomEvent('sectionChange', { detail: 'programs' }))
  }

  const handleCustomersClick = () => {
    setActiveItem("customers")
    // Communicate with coach dashboard
    localStorage.setItem("activeSection", "customers")
    // Trigger a custom event to notify the dashboard
    window.dispatchEvent(new CustomEvent('sectionChange', { detail: 'customers' }))
  }

  // Check if user is customer
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
>>>>>>> signup-issue-resolved
  )
}
