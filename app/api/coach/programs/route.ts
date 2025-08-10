import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, description, price, duration_weeks, coach_id } = await request.json()
    
    if (!name || !description || !coach_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, description, and coach_id are required' 
      }, { status: 400 })
    }

    const result = await pool.query(`
      INSERT INTO coaching_programs (coach_id, name, description, price, duration_weeks, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, price, duration_weeks, is_active, created_at
    `, [coach_id, name, description, price || 0, duration_weeks || 12, true])

    const newProgram = result.rows[0]
    
    return NextResponse.json({
      success: true,
      program: {
        id: newProgram.id,
        name: newProgram.name,
        description: newProgram.description,
        price: parseFloat(newProgram.price),
        duration_weeks: parseInt(newProgram.duration_weeks),
        is_active: newProgram.is_active,
        created_at: newProgram.created_at
      }
    })
  } catch (error) {
    console.error('Error creating program:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create program' 
    }, { status: 500 })
  }
} 