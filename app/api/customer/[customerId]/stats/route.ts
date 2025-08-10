import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params

    // Get customer stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT up.program_id) as total_programs,
        COUNT(DISTINCT CASE WHEN up.status = 'active' THEN up.program_id END) as active_programs,
        COUNT(DISTINCT m.id) as total_milestones,
        COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.milestone_id END) as completed_milestones,
        COALESCE(SUM(p.amount), 0) as total_spent
      FROM user_programs up
      LEFT JOIN coaching_programs cp ON up.program_id = cp.id
      LEFT JOIN milestones m ON cp.id = m.program_id
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = up.user_id
      LEFT JOIN payments p ON up.user_id = p.user_id AND up.program_id = p.program_id
      WHERE up.user_id = $1
    `, [customerId])

    const stats = statsResult.rows[0]
    
    // Calculate completion rate
    const totalMilestones = parseInt(stats.total_milestones) || 0
    const completedMilestones = parseInt(stats.completed_milestones) || 0
    const completionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalPrograms: parseInt(stats.total_programs) || 0,
        activePrograms: parseInt(stats.active_programs) || 0,
        totalMilestones: totalMilestones,
        completedMilestones: completedMilestones,
        totalSpent: parseFloat(stats.total_spent) || 0,
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