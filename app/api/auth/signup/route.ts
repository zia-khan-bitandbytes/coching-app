import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

// Types
interface User {
  id: string
  email: string
  name: string
  password: string
  role: 'coach' | 'customer' | 'super_admin'
  created_at: string
}

interface SignupRequest {
  email: string
  password: string
  name: string
  role?: 'coach' | 'customer' | 'super_admin'
  invitation_data?: {
    coach_id: string
    program_id: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json()
    const { email, password, name, role = 'coach', invitation_data } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Allow customers to sign up only if they have invitation data
    if (role === 'customer' && !invitation_data) {
      return NextResponse.json(
        { error: 'Customers must be invited to sign up' },
        { status: 400 }
      )
    }

    // Only allow coaches to sign up directly (without invitation)
    if (role !== 'coach' && !invitation_data) {
      return NextResponse.json(
        { error: 'Only coaches can sign up directly. Customers and super admins must be invited.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 500 }
      )
    }

    // Check if user already exists
    const existingUserResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user in database
    const result = await pool.query(
      'INSERT INTO users (email, name, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [email.toLowerCase(), name, hashedPassword, role]
    )

    const newUser = result.rows[0] as User

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser
    
    const response = NextResponse.json({
      message: `${role === 'coach' ? 'Coach' : 'Customer'} account created successfully`,
      user: userWithoutPassword
    }, { status: 201 })
    
    // Set user cookie to automatically log in the user
    response.cookies.set('user', JSON.stringify(userWithoutPassword), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    return response

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 