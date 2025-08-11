"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RoadmapEditor } from "@/components/roadmap-editor"

export default function RoadmapEditorPage() {
  const [user, setUser] = useState<{ coach_id?: string } | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  return (
    <DashboardLayout isAdmin={true}>
      <RoadmapEditor coachId={user?.coach_id} />
    </DashboardLayout>
  )
}
