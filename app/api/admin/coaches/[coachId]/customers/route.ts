import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { coachId: string } }
) {
  try {
    const coachId = await params.coachId

    // Get coach customers with their stats
    const customersResult = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT up.program_id) as enrolled_programs,
        COUNT(DISTINCT mp.milestone_id) as completed_milestones,
        COALESCE(SUM(p.amount), 0) as total_spent
      FROM users u
      JOIN coach_customers cc ON u.id = cc.customer_id
      LEFT JOIN user_programs up ON u.id = up.user_id AND up.status = 'active'
      LEFT JOIN milestone_progress mp ON u.id = mp.user_id AND mp.completed = true
      LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'completed'
      WHERE cc.coach_id = $1
      GROUP BY u.id, u.name, u.email
      ORDER BY u.name
    `, [coachId])

    const customers = customersResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      enrolled_programs: parseInt(row.enrolled_programs),
      completed_milestones: parseInt(row.completed_milestones),
      total_spent: parseFloat(row.total_spent)
    }))

    return NextResponse.json({
      success: true,
      customers: customers
    })
  } catch (error) {
    console.error('Error fetching coach customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coach customers' },
      { status: 500 }
    )
  }
} 