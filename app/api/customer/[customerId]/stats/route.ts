import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params

    // Get customer stats with proper milestone filtering - only count milestones from enrolled programs
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT up.program_id) as total_programs,
        COUNT(DISTINCT CASE WHEN up.status = 'active' THEN up.program_id END) as active_programs,
        COUNT(DISTINCT m.id) as total_milestones,
        COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.milestone_id END) as completed_milestones
      FROM user_programs up
      INNER JOIN coaching_programs cp ON up.program_id = cp.id
      INNER JOIN milestones m ON cp.id = m.program_id
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = up.user_id
      WHERE up.user_id = $1
    `, [customerId])

    const stats = statsResult.rows[0]
    
    // Additional debugging: Get detailed milestone information
    const milestoneDebugResult = await pool.query(`
      SELECT 
        up.program_id,
        cp.name as program_name,
        COUNT(m.id) as milestone_count,
        COUNT(CASE WHEN mp.completed = true THEN mp.milestone_id END) as completed_count
      FROM user_programs up
      INNER JOIN coaching_programs cp ON up.program_id = cp.id
      INNER JOIN milestones m ON cp.id = m.program_id
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = up.user_id
      WHERE up.user_id = $1
      GROUP BY up.program_id, cp.name
    `, [customerId])
    
    // Calculate completion rate with proper validation
    const totalMilestones = parseInt(stats.total_milestones) || 0
    const completedMilestones = parseInt(stats.completed_milestones) || 0
    
    // Ensure completion rate is calculated correctly
    let completionRate = 0
    if (totalMilestones > 0) {
      completionRate = Math.round((completedMilestones / totalMilestones) * 100)
      // Ensure completion rate doesn't exceed 100%
      completionRate = Math.min(completionRate, 100)
    }

    // Add debugging information
    console.log(`Customer ${customerId} stats:`, {
      totalPrograms: parseInt(stats.total_programs) || 0,
      activePrograms: parseInt(stats.active_programs) || 0,
      totalMilestones,
      completedMilestones,
      completionRate,
      rawStats: stats,
      milestoneDebug: milestoneDebugResult.rows
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalPrograms: parseInt(stats.total_programs) || 0,
        activePrograms: parseInt(stats.active_programs) || 0,
        totalMilestones: totalMilestones,
        completedMilestones: completedMilestones,
        completionRate: completionRate
      }
    })
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer stats' },
      { status: 500 }
    )
  }
} 