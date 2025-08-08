"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Map, BookOpen, HelpCircle, Users, X } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast"
import { RoadmapView } from "./roadmap-view"

interface Message {
  id: string
  user: string
  text: string
  timestamp: string
  replies?: Message[]
  reactions?: { [emoji: string]: number }
}

const navigationItems = [
  { id: "roadmap", label: "Roadmap", icon: Map, active: true },
  { id: "resources", label: "Resources", icon: BookOpen, active: false },
  { id: "support", label: "Support", icon: HelpCircle, active: false },
]

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("roadmap")
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleRoadmapClick = () => {
    setIsRoadmapOpen(true)
  }

  const handleCloseRoadmap = () => {
    setIsRoadmapOpen(false)
  }

  // Check if user is customer
  const isCustomer = user?.role === 'customer'

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 p-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            
            // Only show Roadmap for customers
            if (!isCustomer && item.id === "roadmap") {
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
                  if (item.id === "roadmap") {
                    handleRoadmapClick()
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
