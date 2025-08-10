import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params

    // Get customer's assigned coach
    const coachResult = await pool.query(`
      SELECT 
        c.id,
        c.business_name,
        c.bio,
        c.specialization,
        c.hourly_rate,
        u.name as coach_name,
        u.email as coach_email
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      JOIN coach_customers cc ON c.id = cc.coach_id
      WHERE cc.customer_id = $1
    `, [customerId])

    if (coachResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No coach assigned to this customer' },
        { status: 404 }
      )
    }

    const coach = coachResult.rows[0]

    return NextResponse.json({
      success: true,
      coach: {
        id: coach.id,
        business_name: coach.business_name,
        bio: coach.bio,
        specialization: coach.specialization,
        hourly_rate: parseFloat(coach.hourly_rate),
        name: coach.coach_name,
        email: coach.coach_email
      }
    })
  } catch (error) {
    console.error('Error fetching customer coach:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer coach' },
      { status: 500 }
    )
  }
} 