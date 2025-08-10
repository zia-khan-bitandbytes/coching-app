import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { coachId: string } }
) {
  try {
    const coachId = await params.coachId

    // Get coach stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT cc.customer_id) as total_customers,
        COUNT(DISTINCT cp.id) as total_programs,
        COUNT(DISTINCT up.id) as active_programs,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM coaches c
      LEFT JOIN coach_customers cc ON c.id = cc.coach_id
      LEFT JOIN coaching_programs cp ON c.id = cp.coach_id
      LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
      LEFT JOIN payments p ON cp.id = p.program_id AND p.status = 'completed'
      WHERE c.id = $1
    `, [coachId])

    const stats = {
      totalCustomers: parseInt(statsResult.rows[0]?.total_customers || '0'),
      totalPrograms: parseInt(statsResult.rows[0]?.total_programs || '0'),
      activePrograms: parseInt(statsResult.rows[0]?.active_programs || '0'),
      totalRevenue: parseFloat(statsResult.rows[0]?.total_revenue || '0')
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