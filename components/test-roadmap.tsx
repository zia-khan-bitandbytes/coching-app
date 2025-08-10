"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X } from "lucide-react"

export function TestRoadmap() {
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    order_index: ''
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Roadmap Component</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Sample Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Milestones</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAddingMilestone(!isAddingMilestone)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>

            {/* Inline Milestone Form */}
            {isAddingMilestone && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">New Milestone</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingMilestone(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input 
                      placeholder="Enter milestone title"
                      value={milestoneForm.title}
                      onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      placeholder="Enter milestone description"
                      value={milestoneForm.description}
                      onChange={(e) => setMilestoneForm({...milestoneForm, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order</label>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="1"
                      value={milestoneForm.order_index}
                      onChange={(e) => setMilestoneForm({...milestoneForm, order_index: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => {
                      alert(`Milestone: ${milestoneForm.title} - ${milestoneForm.description} - Order: ${milestoneForm.order_index}`)
                      setIsAddingMilestone(false)
                      setMilestoneForm({ title: '', description: '', order_index: '' })
                    }}
                    className="flex-1"
                  >
                    Add Milestone
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsAddingMilestone(false)}
                  >
                    Cancel
                  </Button>
                  </div>
              </div>
            )}
            
            <div className="text-center py-8 text-gray-500">
              No milestones yet. Click "Add Milestone" to create the first one.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 