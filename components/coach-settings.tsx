"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function CoachSettings() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coach Settings</h1>
          <p className="text-gray-600 mt-1">Manage your coaching profile and preferences</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Coach settings section</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Coach settings content will be added here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
