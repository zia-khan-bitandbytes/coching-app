import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { sendEmail } from '@/lib/email-service'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { email, name, program_id } = await request.json()
    const { coachId } = await params

    // Validate required fields
    if (!email || !name || !program_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get coach information
    const coachResult = await pool.query(`
      SELECT u.name as coach_name, c.business_name
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [coachId])

    if (coachResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Coach not found' },
        { status: 404 }
      )
    }

    const coach = coachResult.rows[0]

    // Get program information
    const programResult = await pool.query(`
      SELECT name, description
      FROM coaching_programs
      WHERE id = $1 AND coach_id = $2
    `, [program_id, coachId])

    if (programResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Program not found or access denied' },
        { status: 403 }
      )
    }

    const program = programResult.rows[0]

    // Generate unique invitation token
    const invitationToken = uuidv4()
    
    // Store invitation in database (optional - for tracking)
    await pool.query(`
      INSERT INTO invitations (token, coach_id, program_id, customer_email, customer_name, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      ON CONFLICT (token) DO NOTHING
    `, [invitationToken, coachId, program_id, email, name])

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/invite/${invitationToken}`

    // Send invitation email
    const emailSent = await sendEmail({
      customerEmail: email,
      customerName: name,
      programName: program.name,
      coachName: coach.coach_name,
      coachBusinessName: coach.business_name,
      invitationLink: invitationLink
    })

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send invitation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitationLink: invitationLink,
      invitationToken: invitationToken
    })

  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

