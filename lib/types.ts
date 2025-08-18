// Shared types for the coaching app

export interface TaskFile {
  id: number
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

export interface Task {
  id: number
  title: string
  description?: string
  completed?: boolean
  order_index?: number
  milestone_id?: number
  created_at?: string
  completed_at?: string
  status?: "completed" | "in-progress" | "locked"
  requiresUpload?: boolean
  files?: TaskFile[]
}

export interface Milestone {
  id: number
  title: string
  status: "completed" | "in-progress" | "locked"
  description: string
  order_index?: number
  isLocked?: boolean
  tasks: Task[]
}

// Legacy types for roadmap context (different structure)
export interface RoadmapTask {
  id: string
  name: string
  completed: boolean
  required?: boolean
}

export interface RoadmapMilestone {
  id: string
  name: string
  description: string
  number: number
  tasks: RoadmapTask[]
}

export interface Roadmap {
  id: string
  name: string
  progress: number
  type: string
  createdDate: string
  milestones: RoadmapMilestone[]
  duration: string
} 