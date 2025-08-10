import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, name, program_id, coach_id } = await request.json()

    // Validate required fields
    if (!email || !name || !program_id || !coach_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the program belongs to the coach
    const programCheck = await pool.query(`
      SELECT id FROM coaching_programs 
      WHERE id = $1 AND coach_id = $2
    `, [program_id, coach_id])

    if (programCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Program not found or access denied' },
        { status: 403 }
      )
    }

    // Check if user already exists
    let userResult = await pool.query(`
      SELECT id FROM users WHERE email = $1
    `, [email])

    let userId: string

    if (userResult.rows.length === 0) {
      // Create new user with default password
      const defaultPassword = await bcrypt.hash('password123', 10)
      const newUserResult = await pool.query(`
        INSERT INTO users (email, name, password, role)
        VALUES ($1, $2, $3, 'customer')
        RETURNING id
      `, [email, name, defaultPassword])
      userId = newUserResult.rows[0].id
    } else {
      userId = userResult.rows[0].id
    }

    // Link customer to coach
    await pool.query(`
      INSERT INTO coach_customers (coach_id, customer_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (coach_id, customer_id) 
      DO UPDATE SET status = 'active'
    `, [coach_id, userId])

    // Enroll customer in program
    await pool.query(`
      INSERT INTO user_programs (user_id, program_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (user_id, program_id) 
      DO UPDATE SET status = 'active'
    `, [userId, program_id])

    return NextResponse.json({
      success: true,
      message: 'Member added successfully',
      user_id: userId
    })

  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 