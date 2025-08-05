import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (user.rows.length === 0) {
      return NextResponse.json(
        { error: 'Email does not exist' },
        { status: 404 }
      )
    }

    // Generate reset token (in a real app, you'd use a proper JWT or crypto token)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in database
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, resetTokenExpiry.toISOString(), email.toLowerCase()]
    )

    // Generate reset link for testing
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`
    
    // Log the reset link to console for testing
    console.log('=== PASSWORD RESET LINK ===')
    console.log(`Email: ${email}`)
    console.log(`Reset Link: ${resetLink}`)
    console.log(`Token: ${resetToken}`)
    console.log(`Expires: ${resetTokenExpiry.toISOString()}`)
    console.log('==========================')

    // In a real application, you would send an email here
    // You could integrate with services like SendGrid, AWS SES, or Resend

    return NextResponse.json(
      { message: 'Password reset email sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 