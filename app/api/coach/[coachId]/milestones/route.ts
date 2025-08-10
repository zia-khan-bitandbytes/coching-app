import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { coachId: string } }
) {
  try {
    const { coachId } = await params

    // Get milestone performance for the coach
    const milestonesResult = await pool.query(`
      SELECT 
        m.id,
        m.title,
        cp.name as program_name,
        COUNT(DISTINCT mp.user_id) as completed_count,
        COUNT(DISTINCT up.user_id) as total_customers,
        CASE 
          WHEN COUNT(DISTINCT up.user_id) > 0 THEN 
            ((COUNT(DISTINCT mp.user_id)::float / COUNT(DISTINCT up.user_id)::float) * 100)
          ELSE 0 
        END as completion_rate
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.completed = true
      WHERE cp.coach_id = $1
      GROUP BY m.id, m.title, cp.name, m.order_index
      ORDER BY cp.name, m.order_index
    `, [coachId])

    const milestones = milestonesResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      program_name: row.program_name,
      completed_count: parseInt(row.completed_count),
      total_customers: parseInt(row.total_customers),
      completion_rate: parseFloat(row.completion_rate)
    }))

    return NextResponse.json({
      success: true,
      milestones: milestones
    })
  } catch (error) {
    console.error('Error fetching coach milestones:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coach milestones' },
      { status: 500 }
    )
  }
} 