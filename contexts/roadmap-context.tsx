"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Task {
  id: string
  name: string
  completed: boolean
  required?: boolean
}

export interface Milestone {
  id: string
  name: string
  description: string
  number: number
  tasks: Task[]
}

export interface Roadmap {
  id: string
  name: string
  progress: number
  type: string
  createdDate: string
  milestones: Milestone[]
  duration: string
}

interface RoadmapContextType {
  roadmaps: Roadmap[]
  selectedRoadmapId: string | null
  addRoadmap: (name: string, type: string) => void
  selectRoadmap: (id: string | null) => void
  updateRoadmapProgress: (id: string, progress: number) => void
  addMilestone: (roadmapId: string, milestoneName: string, milestoneDescription: string) => void
  editMilestone: (roadmapId: string, milestoneId: string, newName: string, newDescription: string) => void
  deleteMilestone: (roadmapId: string, milestoneId: string) => void
  addTask: (roadmapId: string, milestoneId: string, taskName: string, required?: boolean) => void
  editTask: (roadmapId: string, milestoneId: string, taskId: string, newName: string) => void
  deleteTask: (roadmapId: string, milestoneId: string, taskId: string) => void
}

const RoadmapContext = createContext<RoadmapContextType | undefined>(undefined)

export function useRoadmap() {
  const context = useContext(RoadmapContext)
  if (context === undefined) {
    throw new Error('useRoadmap must be used within a RoadmapProvider')
  }
  return context
}

interface RoadmapProviderProps {
  children: ReactNode
}

export function RoadmapProvider({ children }: RoadmapProviderProps) {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const savedRoadmaps = localStorage.getItem('coach-roadmaps')
    const savedSelectedId = localStorage.getItem('coach-selected-roadmap')
    
    if (savedRoadmaps) {
      const parsedRoadmaps = JSON.parse(savedRoadmaps)
      
      // Migrate old roadmaps that have milestones as number to array
      const migratedRoadmaps: Roadmap[] = parsedRoadmaps.map((roadmap: any) => ({
        ...roadmap,
        milestones: Array.isArray(roadmap.milestones) 
          ? roadmap.milestones.map((milestone: any) => ({
              ...milestone,
              description: milestone.description || 'Initial assessment and goal setting',
              tasks: Array.isArray(milestone.tasks) ? milestone.tasks : 
                // Add sample tasks for testing the layout
                milestone.number === 1 ? [
                  { id: '1', name: 'Complete onboarding', completed: true, required: false },
                  { id: '2', name: 'Initial consultation', completed: false, required: false },
                  { id: '3', name: 'Upload business plan', completed: false, required: true }
                ] : milestone.number === 2 ? [
                  { id: '4', name: 'Strategy Development', completed: false, required: false }
                ] : []
            }))
          : []
      }))
      
      setRoadmaps(migratedRoadmaps)
    }
    
    if (savedSelectedId) {
      setSelectedRoadmapId(savedSelectedId)
    }
  }, [])

  // Save to localStorage when roadmaps change
  useEffect(() => {
    if (roadmaps.length > 0) {
      localStorage.setItem('coach-roadmaps', JSON.stringify(roadmaps))
    }
  }, [roadmaps])

  // Save to localStorage when selection changes
  useEffect(() => {
    if (selectedRoadmapId) {
      localStorage.setItem('coach-selected-roadmap', selectedRoadmapId)
    }
  }, [selectedRoadmapId])

  const addRoadmap = (name: string, type: string) => {
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    const newRoadmap: Roadmap = {
      id: Date.now().toString(),
      name: name.trim(),
      progress: 0,
      type: type.trim(),
      createdDate: formattedDate,
      milestones: [],
      duration: '8 weeks'
    }
    setRoadmaps(prev => [...prev, newRoadmap])
    setSelectedRoadmapId(newRoadmap.id) // Auto-select new roadmap
  }

  const selectRoadmap = (id: string | null) => {
    setSelectedRoadmapId(id)
  }

  const updateRoadmapProgress = (id: string, progress: number) => {
    setRoadmaps(prev => 
      prev.map(roadmap => 
        roadmap.id === id 
          ? { ...roadmap, progress } 
          : roadmap
      )
    )
  }

  const addMilestone = (roadmapId: string, milestoneName: string, milestoneDescription: string) => {
    setRoadmaps(prev => prev.map(roadmap => {
      if (roadmap.id === roadmapId) {
        const newMilestone: Milestone = {
          id: Date.now().toString(),
          name: milestoneName.trim(),
          description: milestoneDescription.trim(),
          number: roadmap.milestones.length + 1,
          tasks: []
        }
        return {
          ...roadmap,
          milestones: [...roadmap.milestones, newMilestone]
        }
      }
      return roadmap
    }))
  }

  const editMilestone = (roadmapId: string, milestoneId: string, newName: string, newDescription: string) => {
    setRoadmaps(prev => prev.map(roadmap => {
      if (roadmap.id === roadmapId) {
        return {
          ...roadmap,
          milestones: roadmap.milestones.map(milestone => {
            if (milestone.id === milestoneId) {
              return {
                ...milestone,
                name: newName.trim(),
                description: newDescription.trim()
              }
            }
            return milestone
          })
        }
      }
      return roadmap
    }))
  }

  const deleteMilestone = (roadmapId: string, milestoneId: string) => {
    setRoadmaps(prev => prev.map(roadmap => {
      if (roadmap.id === roadmapId) {
        return {
          ...roadmap,
          milestones: roadmap.milestones.filter(milestone => milestone.id !== milestoneId)
        }
      }
      return roadmap
    }))
  }

  const addTask = (roadmapId: string, milestoneId: string, taskName: string, required: boolean = false) => {
    setRoadmaps(prev => prev.map(roadmap => {
      if (roadmap.id === roadmapId) {
        return {
          ...roadmap,
          milestones: roadmap.milestones.map(milestone => {
            if (milestone.id === milestoneId) {
              const newTask: Task = {
                id: Date.now().toString(),
                name: taskName.trim(),
                completed: false,
                required
              }
              return {
                ...milestone,
                tasks: [...milestone.tasks, newTask]
              }
            }
            return milestone
          })
        }
      }
      return roadmap
    }))
  }

  const deleteTask = (roadmapId: string, milestoneId: string, taskId: string) => {
    setRoadmaps(prev => prev.map(roadmap => {
      if (roadmap.id === roadmapId) {
        return {
          ...roadmap,
          milestones: roadmap.milestones.map(milestone => {
            if (milestone.id === milestoneId) {
              return {
                ...milestone,
                tasks: milestone.tasks.filter(task => task.id !== taskId)
              }
            }
            return milestone
          })
        }
      }
      return roadmap
    }))
  }

  const editTask = (roadmapId: string, milestoneId: string, taskId: string, newName: string) => {
    setRoadmaps(prev => prev.map(roadmap => {
      if (roadmap.id === roadmapId) {
        return {
          ...roadmap,
          milestones: roadmap.milestones.map(milestone => {
            if (milestone.id === milestoneId) {
              return {
                ...milestone,
                tasks: milestone.tasks.map(task => {
                  if (task.id === taskId) {
                    return {
                      ...task,
                      name: newName.trim()
                    }
                  }
                  return task
                })
              }
            }
            return milestone
          })
        }
      }
      return roadmap
    }))
  }

  const value = {
    roadmaps,
    selectedRoadmapId,
    addRoadmap,
    selectRoadmap,
    updateRoadmapProgress,
    addMilestone,
    editMilestone,
    deleteMilestone,
    addTask,
    editTask,
    deleteTask
  }

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  )
}