"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, Lock, Play, Target, Trophy, Star, User, BookOpen, Zap, Award, GraduationCap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Milestone {
  id: number
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'locked'
  progress: number
  duration: string
  rewards?: string[]
  tasks?: string[]
  icon: any
}

const sampleMilestones: Milestone[] = [
  {
    id: 1,
    title: "Foundation Setup",
    description: "Complete onboarding and initial assessment",
    status: 'completed',
    progress: 100,
    duration: "2 weeks",
    rewards: ["Profile Badge", "100 Points"],
    tasks: ["Complete profile", "Take assessment", "Set goals"],
    icon: BookOpen
  },
  {
    id: 2,
    title: "Goal Setting & Planning",
    description: "Define clear objectives and create action plans",
    status: 'completed',
    progress: 100,
    duration: "1 week",
    rewards: ["Goal Achievement Badge", "150 Points"],
    tasks: ["Define SMART goals", "Create action plan", "Schedule milestones"],
    icon: Target
  },
  {
    id: 3,
    title: "Strategy Development",
    description: "Develop comprehensive business strategies",
    status: 'in-progress',
    progress: 65,
    duration: "3 weeks",
    rewards: ["Strategy Badge", "200 Points"],
    tasks: ["Market research", "Competitor analysis", "Strategy formulation"],
    icon: Zap
  },
  {
    id: 4,
    title: "Implementation Phase",
    description: "Execute your strategic plans",
            status: 'locked',
    progress: 0,
    duration: "4 weeks",
    rewards: ["Implementation Badge", "300 Points"],
    tasks: ["Resource allocation", "Team building", "Process optimization"],
    icon: Play
  },
  {
    id: 5,
    title: "Optimization & Scaling",
    description: "Optimize processes and scale operations",
    status: 'locked',
    progress: 0,
    duration: "6 weeks",
    rewards: ["Scaling Badge", "500 Points"],
    tasks: ["Performance analysis", "Process improvement", "Scale operations"],
    icon: Award
  },
  {
    id: 6,
    title: "Mastery & Certification",
    description: "Achieve mastery and earn certification",
    status: 'locked',
    progress: 0,
    duration: "2 weeks",
    rewards: ["Master Badge", "1000 Points", "Certification"],
    tasks: ["Final assessment", "Portfolio review", "Certification exam"],
    icon: GraduationCap
  }
]

export function RoadmapView() {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [animateIn, setAnimateIn] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(1) // Start at first completed milestone

  useEffect(() => {
    setAnimateIn(true)
    // Calculate position based on latest completed milestone
    const completedMilestones = sampleMilestones.filter(m => m.status === 'completed')
    const latestCompletedIndex = sampleMilestones.findLastIndex(m => m.status === 'completed')
    setCurrentPosition(latestCompletedIndex >= 0 ? latestCompletedIndex : 0)
  }, [])

  // Function to handle milestone completion (for future use)
  const completeMilestone = (milestoneId: number) => {
    const updatedMilestones = sampleMilestones.map(m => 
      m.id === milestoneId ? { ...m, status: 'completed' as const, progress: 100 } : m
    )
    // In a real app, this would update the database
    // For now, we'll just update the position
    const newPosition = sampleMilestones.findIndex(m => m.id === milestoneId)
    if (newPosition >= 0) {
      setCurrentPosition(newPosition)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'in-progress':
        return <Play className="h-6 w-6 text-blue-500" />

      case 'locked':
        return <Lock className="h-6 w-6 text-gray-400" />
      default:
        return <Target className="h-6 w-6 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'

      case 'locked':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const totalProgress = Math.round(
    sampleMilestones.reduce((acc, milestone) => acc + milestone.progress, 0) / sampleMilestones.length
  )

  const completedMilestones = sampleMilestones.filter(m => m.status === 'completed').length
  const totalMilestones = sampleMilestones.length

  // Calculate the latest completed milestone position
  const latestCompletedIndex = sampleMilestones.findLastIndex(m => m.status === 'completed')
  const avatarPosition = latestCompletedIndex >= 0 ? latestCompletedIndex : 0

  return (
    <div className="space-y-8">
      {/* Header with Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your Learning Journey
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Track your progress through the comprehensive coaching program. Each milestone brings you closer to your goals.
        </p>
      </motion.div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Overall Progress</h3>
            <p className="text-sm text-gray-600">
              {completedMilestones} of {totalMilestones} milestones completed
            </p>
          </div>
          <div className="text-right">
            <motion.div 
              className="text-2xl font-bold text-blue-600"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {totalProgress}%
            </motion.div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>
        <Progress value={totalProgress} className="h-3" />
      </motion.div>

      {/* Animated Roadmap */}
      <div className="relative py-8">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2 z-0" />
        
        {/* Animated Progress Line */}
        <motion.div
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-y-1/2 z-10"
          initial={{ width: 0 }}
          animate={{ width: `${(avatarPosition / (sampleMilestones.length - 1)) * 100}%` }}
          transition={{ duration: 2, delay: 0.5 }}
        />

        {/* Milestones */}
        <div className="relative flex justify-between items-center">
          {sampleMilestones.map((milestone, index) => {
            const Icon = milestone.icon
            const isActive = index <= avatarPosition
            const isCompleted = milestone.status === 'completed'
            const isInProgress = milestone.status === 'in-progress'
            
            return (
              <motion.div
                key={milestone.id}
                className="relative flex flex-col items-center z-20"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                {/* Milestone Circle */}
                <motion.div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-4 relative cursor-pointer transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200' 
                      : isInProgress 
                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200' 
                        : isActive 
                          ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-200' 
                          : 'bg-gray-300 border-gray-300 text-gray-500'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMilestone(milestone)}
                >
                  {/* Milestone Number */}
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-200"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.2 + 0.5 }}
                  >
                    {milestone.id}
                  </motion.div>
                  
                  {/* Icon */}
                  <motion.div
                    animate={{ 
                      rotate: isCompleted ? 360 : 0,
                      scale: isInProgress ? [1, 1.2, 1] : 1
                    }}
                    transition={{ 
                      rotate: { duration: 0.5 },
                      scale: { duration: 0.5, repeat: isInProgress ? Infinity : 0, repeatDelay: 2 }
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  
                  {/* Completion Check */}
                  {isCompleted && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <CheckCircle className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Milestone Title */}
                <motion.div
                  className="mt-3 text-center max-w-24"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                >
                  <div className="text-xs font-semibold text-gray-700 leading-tight">
                    {milestone.title}
                  </div>
                  <Badge className={`mt-1 text-xs ${getStatusColor(milestone.status)}`}>
                    {milestone.status.replace('-', ' ')}
                  </Badge>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Walking Human Avatar with "YOU" Label */}
        <motion.div
          className="absolute z-30"
          animate={{ 
            y: [0, -10, 0]
          }}
          transition={{ 
            y: { duration: 0.5, repeat: Infinity, repeatDelay: 1 }
          }}
          style={{ 
            left: `${(avatarPosition / (sampleMilestones.length - 1)) * 100}%`,
            top: '-57px', // Position much higher with negative value
            transform: 'translateX(-50%)' // Center horizontally
          }}
        >
          {/* Avatar Container */}
          <div className="flex flex-col items-center">
            {/* Human Avatar */}
            <motion.div
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg mb-2"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                scale: { duration: 0.5, repeat: Infinity, repeatDelay: 1 },
                rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 1 }
              }}
            >
              <User className="h-6 w-6 text-white" />
            </motion.div>
            
            {/* "YOU" Label */}
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.5 }}
            >
              YOU
            </motion.div>
            
            {/* Walking Animation Trail */}
            <motion.div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-blue-500 rounded-full opacity-60"
              animate={{ 
                scaleX: [1, 0.8, 1],
                opacity: [0.6, 0.3, 0.6]
              }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Current Milestone Details */}
      <AnimatePresence>
        {selectedMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border-2 border-blue-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedMilestone.status === 'completed' ? 'bg-green-500' :
                  selectedMilestone.status === 'in-progress' ? 'bg-blue-500' :
                  'bg-gray-300'
                }`}>
                  <selectedMilestone.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedMilestone.title}</h3>
                  <Badge className={`mt-1 ${getStatusColor(selectedMilestone.status)}`}>
                    {selectedMilestone.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMilestone(null)}>
                ×
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-gray-600">{selectedMilestone.description}</p>
                
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Tasks</h4>
                  <ul className="space-y-1">
                    {selectedMilestone.tasks?.map((task, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Progress</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completion</span>
                      <span>{selectedMilestone.progress}%</span>
                    </div>
                    <Progress value={selectedMilestone.progress} className="h-3" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Rewards</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMilestone.rewards?.map((reward, idx) => (
                        <Badge key={idx} variant="outline" className="bg-yellow-50">
                          {reward}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
