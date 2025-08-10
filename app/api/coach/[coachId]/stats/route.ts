import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { coachId: string } }
) {
  try {
    const { coachId } = await params

    // Get coach stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT cc.customer_id) as total_customers,
        COUNT(DISTINCT cp.id) as total_programs,
        COUNT(DISTINCT m.id) as total_milestones,
        COUNT(DISTINCT up.id) as active_enrollments,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN p.payment_date >= DATE_TRUNC('month', CURRENT_DATE) THEN p.amount ELSE 0 END), 0) as monthly_revenue,
        CASE 
          WHEN COUNT(DISTINCT up.id) > 0 THEN 
            ((COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END)::float / COUNT(DISTINCT up.id)::float) * 100)
          ELSE 0 
        END as completion_rate
      FROM coaches c
      LEFT JOIN coach_customers cc ON c.id = cc.coach_id
      LEFT JOIN coaching_programs cp ON c.id = cp.coach_id
      LEFT JOIN milestones m ON cp.id = m.program_id
      LEFT JOIN user_programs up ON cp.id = up.program_id
      LEFT JOIN payments p ON cp.id = p.program_id AND p.status = 'completed'
      WHERE c.id = $1
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