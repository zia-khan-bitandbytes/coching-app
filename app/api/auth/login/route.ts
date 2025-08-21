import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

// Types
interface User {
  id: string
  email: string
  name: string
  password?: string
  password_hash?: string
  role: 'coach' | 'customer' | 'super_admin'
  created_at: string
  coach_id?: string
  business_name?: string
}

interface LoginRequest {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get user from database with coach_id if user is a coach
    const result = await pool.query(
      `SELECT u.*, c.id as coach_id, c.business_name 
       FROM users u 
       LEFT JOIN coaches c ON u.id = c.user_id 
       WHERE u.email = $1`,
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = result.rows[0] as User & { coach_id?: string; business_name?: string }

    // Verify password - check both password and password_hash columns
    const userPassword = user.password || user.password_hash
    if (!userPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    const isValidPassword = await bcrypt.compare(password, userPassword)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    
    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword
    })
    
    // Set user cookie
    response.cookies.set('user', JSON.stringify(userWithoutPassword), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 