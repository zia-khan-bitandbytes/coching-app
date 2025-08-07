import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    // Assume user is authenticated and user id is available from session/localStorage (for demo, get from email)
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    // Find user by email
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userRes.rows[0]
    let updateQuery = 'UPDATE users SET name = $1'
    let params: any[] = [name]
    if (password) {
      const hashed = await bcrypt.hash(password, 12)
      updateQuery += ', password = $2'
      params.push(hashed)
    }
    updateQuery += ' WHERE email = $' + (params.length + 1) + ' RETURNING id, name, email, role'
    params.push(email)
    const updated = await pool.query(updateQuery, params)
    return NextResponse.json({ user: updated.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}