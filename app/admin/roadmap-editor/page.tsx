"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RoadmapEditor } from "@/components/roadmap-editor"

export default function RoadmapEditorPage() {
  const [user, setUser] = useState<{ coach_id?: string } | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      console.log('User data from localStorage:', parsedUser)
      setUser(parsedUser)
    }
  }, [])

  return (
    <DashboardLayout isAdmin={true}>
      {user?.coach_id ? (
        <RoadmapEditor coachId={user.coach_id} />
      ) : (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Coach Profile Not Found</h2>
          <p className="text-muted-foreground">Please contact support to set up your coach profile.</p>
        </div>
      )}
    </DashboardLayout>
  )
}
