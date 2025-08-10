import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params

    // Get customer's enrolled programs
    const programsResult = await pool.query(`
      SELECT 
        cp.id,
        cp.name,
        cp.description,
        cp.duration_weeks,
        cp.price,
        up.status,
        up.enrolled_at,
        c.business_name as coach_business_name
      FROM coaching_programs cp
      JOIN user_programs up ON cp.id = up.program_id
      JOIN coaches c ON cp.coach_id = c.id
      WHERE up.user_id = $1
      ORDER BY up.enrolled_at DESC
    `, [customerId])

    const programs = programsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      duration_weeks: parseInt(row.duration_weeks),
      price: parseFloat(row.price),
      status: row.status,
      enrolled_at: row.enrolled_at,
      coach_business_name: row.coach_business_name
    }))

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