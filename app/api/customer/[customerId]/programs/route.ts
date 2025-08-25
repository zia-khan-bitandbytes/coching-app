import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = await params

    // Get customer's enrolled programs with milestones and progress
    const programsResult = await pool.query(`
      SELECT 
        cp.id,
        cp.title as name,
        cp.description,
        cp.price,
        up.enrolled_at,
        c.business_name as coach_business_name,
        m.id as milestone_id,
        m.title as milestone_title,
        m.description as milestone_description,
        m.order_index,
        m.goal_days,
        mp.completed as milestone_completed,
        mp.completed_at as milestone_completed_at,
        mp.created_at as milestone_started_at,
        mp.notes as milestone_notes
      FROM coaching_programs cp
      JOIN user_programs up ON cp.id = up.program_id
      JOIN coaches c ON cp.coach_id = c.id
      LEFT JOIN milestones m ON cp.id = m.program_id
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = $1
      WHERE up.user_id = $1
      ORDER BY up.enrolled_at DESC, m.order_index ASC
    `, [customerId])

    // Group programs with their milestones
    const programsMap = new Map()
    
    programsResult.rows.forEach(row => {
      const programId = row.id
      
      if (!programsMap.has(programId)) {
        programsMap.set(programId, {
          id: row.id,
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          enrolled_at: row.enrolled_at,
          coach_business_name: row.coach_business_name,
          milestones: [],
          completedMilestones: 0,
          totalMilestones: 0,
          completionRate: 0
        })
      }
      
      if (row.milestone_id) {
        // Calculate milestone status and timing
        const enrolledDate = new Date(row.enrolled_at)
        const currentDate = new Date()
        const milestoneStartedAt = row.milestone_started_at ? new Date(row.milestone_started_at) : null
        const milestoneCompletedAt = row.milestone_completed_at ? new Date(row.milestone_completed_at) : null
        
        let status = "locked"
        let isLocked = true
        let isOverdue = false
        let daysOverdue = 0
        let completionTime = null
        
        if (row.milestone_completed) {
          status = "completed"
          isLocked = false
          if (milestoneCompletedAt && row.goal_days) {
            // For completed milestones, calculate from start date to completion date
            const startDate = milestoneStartedAt || enrolledDate
            const actualDays = Math.ceil((milestoneCompletedAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            completionTime = {
              actualDays,
              goalDays: row.goal_days,
              isOnTime: actualDays <= row.goal_days,
              daysSaved: Math.max(0, row.goal_days - actualDays),
              daysOver: Math.max(0, actualDays - row.goal_days)
            }
          }
        } else if (row.milestone_started_at) {
          status = "in-progress"
          isLocked = false
          
          // Check if overdue - calculate from milestone start date, not enrollment date
          if (row.goal_days && milestoneStartedAt) {
            const daysSinceStart = Math.ceil((currentDate.getTime() - milestoneStartedAt.getTime()) / (1000 * 60 * 60 * 24))
            if (daysSinceStart > row.goal_days) {
              isOverdue = true
              daysOverdue = daysSinceStart - row.goal_days
            }
          }
        }
        
        const milestone = {
          id: row.milestone_id,
          title: row.milestone_title,
          description: row.milestone_description,
          order_index: parseInt(row.order_index),
          goal_days: row.goal_days,
          completed: row.milestone_completed || false,
          completed_at: row.milestone_completed_at,
          progress_created_at: row.milestone_started_at,
          notes: row.milestone_notes,
          status,
          isLocked,
          isOverdue,
          daysOverdue,
          completionTime,
          program_name: row.name,
          program_id: row.id,
          tasks: []
        }
        
        const program = programsMap.get(programId)
        program.milestones.push(milestone)
        program.totalMilestones++
        if (milestone.completed) {
          program.completedMilestones++
        }
      }
    })
    
    // Calculate completion rates and locked status with sequential unlocking
    const programs = Array.from(programsMap.values()).map(program => {
      program.completionRate = program.totalMilestones > 0 
        ? Math.round((program.completedMilestones / program.totalMilestones) * 100) 
        : 0
      
      // Calculate locked status for milestones (sequential unlocking)
      program.milestones.forEach((milestone: any, index: number) => {
        if (index === 0) {
          milestone.isLocked = false // First milestone is always unlocked
          // Don't override status if milestone is already started or completed
          if (!milestone.started_at && !milestone.completed) {
            milestone.status = "upcoming"
          }
        } else {
          // Check if previous milestone is completed
          const previousMilestone = program.milestones[index - 1]
          milestone.isLocked = !previousMilestone.completed
          
          if (milestone.isLocked) {
            milestone.status = "locked"
          } else if (!milestone.started_at && !milestone.completed) {
            milestone.status = "upcoming"
          }
        }
      })
      
      return program
    })

    return NextResponse.json({
      success: true,
      programs: programs
    })
  } catch (error) {
    console.error('Error fetching customer programs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer programs' },
      { status: 500 }
    )
  }
} 