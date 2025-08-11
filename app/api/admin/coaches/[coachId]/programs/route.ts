import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params

    // Get coach programs with enrollment counts
    const programsResult = await pool.query(`
      SELECT 
        cp.id,
        cp.name,
        cp.description,
        cp.duration_weeks,
        cp.price,
        COUNT(up.id) as enrolled_customers
      FROM coaching_programs cp
      LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
      WHERE cp.coach_id = $1
      GROUP BY cp.id, cp.name, cp.description, cp.duration_weeks, cp.price
      ORDER BY cp.created_at DESC
    `, [coachId])

    const programs = programsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      duration_weeks: parseInt(row.duration_weeks),
      price: parseFloat(row.price),
      enrolled_customers: parseInt(row.enrolled_customers)
    }))

    return NextResponse.json({
      success: true,
      programs: programs
    })
  } catch (error) {
    console.error('Error fetching coach programs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coach programs' },
      { status: 500 }
    )
  }
} 