import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Get invitation details
    const invitationResult = await pool.query(`
      SELECT 
        i.id,
        i.coach_id,
        i.program_id,
        i.customer_email,
        i.customer_name,
        i.status,
        i.expires_at
      FROM invitations i
      WHERE i.token = $1
    `, [token])

    if (invitationResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    const invitation = invitationResult.rows[0]

    // Check if invitation is already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { success: false, error: 'Invitation already accepted' },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if customer already exists
    let customerResult = await pool.query(`
      SELECT id, name FROM users WHERE email = $1 AND role = 'customer'
    `, [invitation.customer_email])

    let customerExists = customerResult.rows.length > 0
    let existingCustomerId = customerExists ? customerResult.rows[0].id : null

    // Mark invitation as accepted
    await pool.query(`
      UPDATE invitations 
      SET status = 'accepted', accepted_at = NOW()
      WHERE token = $1
    `, [token])

    if (customerExists) {
      // Customer already exists - link them to coach and program
      await pool.query(`
        INSERT INTO coach_customers (coach_id, customer_id, status)
        VALUES ($1, $2, 'active')
        ON CONFLICT (coach_id, customer_id) 
        DO UPDATE SET status = 'active'
      `, [invitation.coach_id, existingCustomerId])

      // Enroll customer in program
      await pool.query(`
        INSERT INTO user_programs (user_id, program_id, status)
        VALUES ($1, $2, 'active')
        ON CONFLICT (user_id, program_id) 
        DO UPDATE SET status = 'active'
      `, [existingCustomerId, invitation.program_id])

      // Get full customer data for automatic login
      const customerDataResult = await pool.query(`
        SELECT id, email, name, role, created_at FROM users WHERE id = $1
      `, [existingCustomerId])

      const customerData = customerDataResult.rows[0]

      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully',
        customer_exists: true,
        customer_id: existingCustomerId,
        redirect_to: '/dashboard',
        user_data: customerData // Include user data for automatic login
      })
    } else {
      // Customer doesn't exist - return signup redirect
      return NextResponse.json({
        success: true,
        message: 'Invitation accepted, customer needs to sign up',
        customer_exists: false,
        redirect_to: '/customer-signup',
        invitation_data: {
          email: invitation.customer_email,
          name: invitation.customer_name,
          coach_id: invitation.coach_id,
          program_id: invitation.program_id
        }
      })
    }

  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

