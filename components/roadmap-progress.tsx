"use client"

import { cn } from "@/lib/utils"
import { User } from "lucide-react"

interface Milestone {
  id: number
  title: string
  status: "completed" | "in-progress" | "blocked"
}

interface RoadmapProgressProps {
  milestones: Milestone[]
  currentMilestone: number
}

export function RoadmapProgress({ milestones, currentMilestone }: RoadmapProgressProps) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-gray-600">START</span>
        <span className="text-sm font-medium text-gray-600">GOAL</span>
      </div>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${((currentMilestone - 1) / (milestones.length - 1)) * 100}%` }}
          />
        </div>

        {/* Milestone points */}
        <div className="flex justify-between items-center relative">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center relative z-10 bg-white",
                  milestone.status === "completed" && "border-blue-500 bg-blue-500",
                  milestone.status === "in-progress" && "border-blue-500 bg-white",
                  milestone.status === "blocked" && "border-gray-300 bg-white",
                )}
              >
                {milestone.status === "completed" && <div className="w-2 h-2 bg-white rounded-full" />}
                {milestone.status === "in-progress" && <User className="w-4 h-4 text-blue-500" />}
              </div>

              {milestone.status === "in-progress" && (
                <div className="mt-2 text-xs text-blue-600 font-medium">YOU ARE HERE</div>
              )}

              <div className="mt-1 text-sm text-gray-600">{milestone.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
