"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RoadmapEditorProps {
  coachId?: string
}

export function RoadmapEditor({ coachId }: RoadmapEditorProps = {}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roadmap Editor</h1>
          <p className="text-gray-600 mt-1">Create and manage coaching programs and milestones</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap Editor</CardTitle>
          <CardDescription>Roadmap editor section</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Roadmap editor content will be added here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
