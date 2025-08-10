import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string } }
) {
  try {
    const { coachId, programId } = params
    const { customerId } = await request.json()

    // Verify the program belongs to the coach
    const programCheck = await pool.query(`
      SELECT id, name FROM coaching_programs 
      WHERE id = $1 AND coach_id = $2
    `, [programId, coachId])

    if (programCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Program not found or access denied' },
        { status: 404 }
      )
    }

    // Verify the customer exists and is a customer role
    const customerCheck = await pool.query(`
      SELECT id, name, email FROM users 
      WHERE id = $1 AND role = 'customer'
    `, [customerId])

    if (customerCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if customer is already enrolled
    const existingEnrollment = await pool.query(`
      SELECT id FROM user_programs 
      WHERE user_id = $1 AND program_id = $2
    `, [customerId, programId])

    if (existingEnrollment.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Customer is already enrolled in this program' },
        { status: 400 }
      )
    }

    // Enroll the customer in the program
    const enrollmentResult = await pool.query(`
      INSERT INTO user_programs (user_id, program_id, status)
      VALUES ($1, $2, 'active')
      RETURNING id, enrolled_at
    `, [customerId, programId])

    // Also add to coach_customers if not already there
    await pool.query(`
      INSERT INTO coach_customers (coach_id, customer_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (coach_id, customer_id) DO UPDATE SET status = 'active'
    `, [coachId, customerId])

    const enrollment = enrollmentResult.rows[0]

    return NextResponse.json({
      success: true,
      message: 'Customer enrolled successfully',
      enrollment: {
        id: enrollment.id,
        customer_id: customerId,
        program_id: programId,
        enrolled_at: enrollment.enrolled_at,
        status: 'active'
      }
    })
  } catch (error) {
    console.error('Error enrolling customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enroll customer' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string } }
) {
  try {
    const { coachId, programId } = params

    // Verify the program belongs to the coach
    const programCheck = await pool.query(`
      SELECT id, name FROM coaching_programs 
      WHERE id = $1 AND coach_id = $2
    `, [programId, coachId])

    if (programCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Program not found or access denied' },
        { status: 404 }
      )
    }

    // Get all enrolled customers for this program
    const enrollmentsResult = await pool.query(`
      SELECT 
        up.id,
        up.user_id,
        up.status,
        up.enrolled_at,
        up.completed_at,
        u.name,
        u.email,
        u.created_at as customer_since,
        COUNT(mp.milestone_id) as completed_milestones,
        (SELECT COUNT(*) FROM milestones WHERE program_id = $1) as total_milestones
      FROM user_programs up
      JOIN users u ON up.user_id = u.id
      LEFT JOIN milestone_progress mp ON up.user_id = mp.user_id 
        AND mp.completed = true
        AND mp.milestone_id IN (SELECT id FROM milestones WHERE program_id = $1)
      WHERE up.program_id = $1
      GROUP BY up.id, up.user_id, up.status, up.enrolled_at, up.completed_at, u.name, u.email, u.created_at
      ORDER BY up.enrolled_at DESC
    `, [programId])

    const enrollments = enrollmentsResult.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      status: row.status,
      enrolled_at: row.enrolled_at,
      completed_at: row.completed_at,
      customer_since: row.customer_since,
      completed_milestones: parseInt(row.completed_milestones),
      total_milestones: parseInt(row.total_milestones),
      progress_percentage: row.total_milestones > 0 
        ? Math.round((row.completed_milestones / row.total_milestones) * 100) 
        : 0
    }))

    return NextResponse.json({
      success: true,
      program_name: programCheck.rows[0].name,
      enrollments: enrollments
    })
  } catch (error) {
    console.error('Error fetching program enrollments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch program enrollments' },
      { status: 500 }
    )
  }
} 