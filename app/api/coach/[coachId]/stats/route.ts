import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params

    if (!coachId) {
      return NextResponse.json(
        { success: false, error: 'Coach ID is required' },
        { status: 400 }
      )
    }

    // Get coach stats with proper milestone completion calculation
    const statsResult = await pool.query(`
      WITH program_stats AS (
        SELECT 
          cp.id as program_id,
          COUNT(DISTINCT m.id) as total_milestones,
          COUNT(DISTINCT up.user_id) as enrolled_users,
          COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.user_id END) as users_with_completed_milestones
        FROM coaching_programs cp
        LEFT JOIN milestones m ON cp.id = m.program_id
        LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
        LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.completed = true
        WHERE cp.coach_id = $1
        GROUP BY cp.id
      ),
      overall_stats AS (
        SELECT 
          COUNT(DISTINCT cc.customer_id) as total_customers,
          COUNT(DISTINCT cp.id) as total_programs,
          SUM(ps.total_milestones) as total_milestones,
          COUNT(DISTINCT up.id) as active_enrollments,
          COALESCE(SUM(p.amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN p.payment_date >= DATE_TRUNC('month', CURRENT_DATE) THEN p.amount ELSE 0 END), 0) as monthly_revenue,
          SUM(ps.users_with_completed_milestones) as total_completed_milestones,
          SUM(ps.total_milestones * ps.enrolled_users) as total_possible_milestones
        FROM coaches c
        LEFT JOIN coach_customers cc ON c.id = cc.coach_id
        LEFT JOIN coaching_programs cp ON c.id = cp.coach_id
        LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
        LEFT JOIN payments p ON cp.id = p.program_id AND p.status = 'completed'
        LEFT JOIN program_stats ps ON cp.id = ps.program_id
        WHERE c.id = $1
      )
      SELECT 
        total_customers,
        total_programs,
        total_milestones,
        active_enrollments,
        total_revenue,
        monthly_revenue,
        CASE 
          WHEN total_possible_milestones > 0 THEN 
            ROUND((total_completed_milestones::numeric / total_possible_milestones::numeric) * 100, 2)
          ELSE 0 
        END as completion_rate
      FROM overall_stats
    `, [coachId])

    const stats = {
      totalCustomers: parseInt(statsResult.rows[0]?.total_customers || '0'),
      totalPrograms: parseInt(statsResult.rows[0]?.total_programs || '0'),
      totalMilestones: parseInt(statsResult.rows[0]?.total_milestones || '0'),
      totalRevenue: parseFloat(statsResult.rows[0]?.total_revenue || '0'),
      activeEnrollments: parseInt(statsResult.rows[0]?.active_enrollments || '0'),
      monthlyRevenue: parseFloat(statsResult.rows[0]?.monthly_revenue || '0'),
      completionRate: parseFloat(statsResult.rows[0]?.completion_rate || '0')
    }

    console.log('Coach stats calculated:', {
      raw: statsResult.rows[0],
      processed: stats
    })

    return NextResponse.json({
      success: true,
      stats: stats
    })
  } catch (error) {
    console.error('Error fetching coach stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coach stats' },
      { status: 500 }
    )
  }
} 