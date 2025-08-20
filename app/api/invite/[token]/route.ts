import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Get invitation with program and coach details
    const invitationResult = await pool.query(`
      SELECT 
        i.id,
        i.token,
        i.coach_id,
        i.program_id,
        i.customer_email,
        i.customer_name,
        i.status,
        i.created_at,
        i.expires_at,
        cp.name as program_name,
        cp.description as program_description,
        cp.price,
        u.name as coach_name,
        c.business_name,
        c.specialization
      FROM invitations i
      JOIN coaching_programs cp ON i.program_id = cp.id
      JOIN coaches c ON i.coach_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE i.token = $1
    `, [token])

    if (invitationResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    const invitation = invitationResult.rows[0]

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date() && invitation.status === 'pending') {
      // Update status to expired
      await pool.query(`
        UPDATE invitations 
        SET status = 'expired' 
        WHERE token = $1
      `, [token])
      
      invitation.status = 'expired'
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitation.token,
        coach_id: invitation.coach_id,
        program_id: invitation.program_id,
        customer_email: invitation.customer_email,
        customer_name: invitation.customer_name,
        status: invitation.status,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
        program: {
          name: invitation.program_name,
          description: invitation.program_description,
          price: parseFloat(invitation.price)
        },
        coach: {
          name: invitation.coach_name,
          business_name: invitation.business_name,
          specialization: invitation.specialization
        }
      }
    })

  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

