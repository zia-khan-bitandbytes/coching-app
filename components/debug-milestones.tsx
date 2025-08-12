"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DebugMilestone {
  id: string
  title: string
  description: string
  order_index: number
  completed: boolean
  completed_at?: string
  program_name: string
  status?: "completed" | "in-progress" | "locked"
  isLocked?: boolean
  tasks?: any[]
}

export function DebugMilestones({ customerId }: { customerId: string }) {
  const [milestones, setMilestones] = useState<DebugMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMilestones()
  }, [customerId])

  const fetchMilestones = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer/${customerId}/milestones`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Raw milestones data:', data)
        setMilestones(data.milestones || [])
      } else {
        setError('Failed to fetch milestones')
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
      setError('Error fetching milestones')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading milestones...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug Milestones</h1>
        <p className="text-gray-600">
          This shows the raw milestone data to help debug the locking issue.
        </p>
      </div>

      <div className="grid gap-4">
        {milestones.map((milestone) => (
          <Card key={milestone.id} className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">{milestone.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Basic Info</h4>
                  <div className="space-y-1">
                    <div><strong>ID:</strong> {milestone.id}</div>
                    <div><strong>Order Index:</strong> {milestone.order_index}</div>
                    <div><strong>Status:</strong> <span className="font-mono">{milestone.status}</span></div>
                    <div><strong>Completed:</strong> <span className="font-mono">{milestone.completed.toString()}</span></div>
                    <div><strong>isLocked:</strong> <span className="font-mono">{milestone.isLocked?.toString() ?? 'undefined'}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Raw Data</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(milestone, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-semibold text-yellow-800 mb-2">Analysis</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>
                    <strong>Should be unlocked:</strong> {milestone.order_index === 1 ? 'Yes (first milestone)' : 'Depends on previous milestone'}
                  </div>
                  <div>
                    <strong>API says locked:</strong> {milestone.isLocked ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Status calculation:</strong> {milestone.status === 'locked' ? 'API calculated as locked' : 'API calculated as unlocked'}
                  </div>
                  {milestone.order_index === 1 && milestone.isLocked && (
                    <div className="font-bold text-red-600">
                      ⚠️ ISSUE: First milestone is marked as locked by API!
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Summary</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div><strong>Total milestones:</strong> {milestones.length}</div>
          <div><strong>Completed:</strong> {milestones.filter(m => m.completed).length}</div>
          <div><strong>In Progress:</strong> {milestones.filter(m => m.status === 'in-progress').length}</div>
          <div><strong>Locked:</strong> {milestones.filter(m => m.status === 'locked').length}</div>
          <div><strong>First milestone locked:</strong> {milestones.find(m => m.order_index === 1)?.isLocked ? 'Yes (ISSUE!)' : 'No (Correct)'}</div>
        </div>
      </div>
    </div>
  )
}
