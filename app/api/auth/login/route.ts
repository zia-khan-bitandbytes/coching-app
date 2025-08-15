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

    // Get user from database
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = result.rows[0] as User

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get complete user data with coach information
    const completeUserResult = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at, c.id as coach_id, c.business_name
      FROM users u
      LEFT JOIN coaches c ON u.id = c.user_id
      WHERE u.id = $1
    `, [user.id])

    const completeUser = completeUserResult.rows[0]
    
    const response = NextResponse.json({
      message: 'Login successful',
      user: completeUser
    })
    
    // Set user cookie
    response.cookies.set('user', JSON.stringify(completeUser), {
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