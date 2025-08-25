import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { sendEmail } from '@/lib/email-service'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    console.log('=== INVITATION API START ===');
    console.log('Request received for invitation');
    console.log('Environment check - SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
    console.log('Environment check - SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { email, name, program_id } = body;
    const { coachId } = await params;
    
    console.log('Extracted data:', { email, name, program_id, coachId });

    // Test database connection
    try {
      console.log('Testing database connection...');
      const testResult = await pool.query('SELECT NOW() as current_time');
      console.log('Database connection test successful:', testResult.rows[0]);
    } catch (dbTestError) {
      console.error('Database connection test failed:', dbTestError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Validate required fields
    if (!email || !name || !program_id) {
      console.error('Missing required fields:', { email, name, program_id });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get coach information
    console.log('Querying coach information for coachId:', coachId);
    const coachResult = await pool.query(`
      SELECT u.name as coach_name, c.business_name
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [coachId])

    console.log('Coach query result:', coachResult.rows);

    if (coachResult.rows.length === 0) {
      console.error('Coach not found for coachId:', coachId);
      return NextResponse.json(
        { success: false, error: 'Coach not found' },
        { status: 404 }
      )
    }

    const coach = coachResult.rows[0]
    console.log('Coach found:', coach);

    // Get program information
    console.log('Querying program information for programId:', program_id, 'and coachId:', coachId);
    const programResult = await pool.query(`
      SELECT name, description
      FROM coaching_programs
      WHERE id = $1 AND coach_id = $2
    `, [program_id, coachId])

    console.log('Program query result:', programResult.rows);

    if (programResult.rows.length === 0) {
      console.error('Program not found or access denied for programId:', program_id, 'coachId:', coachId);
      return NextResponse.json(
        { success: false, error: 'Program not found or access denied' },
        { status: 403 }
      )
    }

    const program = programResult.rows[0]
    console.log('Program found:', program);

    // Generate unique invitation token
    const invitationToken = uuidv4()
    console.log('Generated invitation token:', invitationToken);
    
    // Store invitation in database (optional - for tracking)
    console.log('Storing invitation in database...');
    try {
      await pool.query(`
        INSERT INTO invitations (token, coach_id, program_id, customer_email, customer_name, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
        ON CONFLICT (token) DO NOTHING
      `, [invitationToken, coachId, program_id, email, name])
      console.log('Invitation stored in database successfully');
    } catch (dbError) {
      console.error('Database error storing invitation:', dbError);
      // Continue anyway as this is optional
    }

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/invite/${invitationToken}`
    console.log('Generated invitation link:', invitationLink);

    // Send invitation email
    console.log('Sending invitation email...');
    console.log('Email data:', {
      customerEmail: email,
      customerName: name,
      programName: program.name,
      coachName: coach.coach_name,
      coachBusinessName: coach.business_name,
      invitationLink: invitationLink
    });
    
    const emailSent = await sendEmail({
      customerEmail: email,
      customerName: name,
      programName: program.name,
      coachName: coach.coach_name,
      coachBusinessName: coach.business_name,
      invitationLink: invitationLink
    })

    console.log('Email service result:', emailSent);

    if (!emailSent) {
      console.error('Failed to send invitation email');
      return NextResponse.json(
        { success: false, error: 'Failed to send invitation email' },
        { status: 500 }
      )
    }

    console.log('Invitation successful, returning response');
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
  } finally {
    console.log('=== INVITATION API END ===');
  }
}

