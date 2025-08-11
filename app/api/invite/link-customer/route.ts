import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { customer_id, coach_id, program_id } = await request.json()

    if (!customer_id || !coach_id || !program_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Link customer to coach
    await pool.query(`
      INSERT INTO coach_customers (coach_id, customer_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (coach_id, customer_id) 
      DO UPDATE SET status = 'active'
    `, [coach_id, customer_id])

    // Enroll customer in program
    await pool.query(`
      INSERT INTO user_programs (user_id, program_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (user_id, program_id) 
      DO UPDATE SET status = 'active'
    `, [customer_id, program_id])

    return NextResponse.json({
      success: true,
      message: 'Customer linked to coach and program successfully'
    })

  } catch (error) {
    console.error('Error linking customer:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
