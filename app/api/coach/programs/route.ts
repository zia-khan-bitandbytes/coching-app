import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, description, price, duration_days, coach_id } = await request.json()
    
    if (!name || !description || !coach_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, description, and coach_id are required' 
      }, { status: 400 })
    }

    // Check if duration_days column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'coaching_programs' 
      AND column_name = 'duration_days'
    `)

    const hasDurationColumn = columnCheck.rows.length > 0

    let result: any
    if (hasDurationColumn) {
      // Use the new query with duration_days - insert into both name and title columns
      result = await pool.query(`
        INSERT INTO coaching_programs (coach_id, name, title, description, price, duration_days, is_active)
        VALUES ($1, $2, $2, $3, $4, $5, $6)
        RETURNING id, name, title, description, price, duration_days, is_active, created_at
      `, [coach_id, name, description, price || 0, duration_days || 30, true])
    } else {
      // Use the old query without duration_days - insert into both name and title columns
      result = await pool.query(`
        INSERT INTO coaching_programs (coach_id, name, title, description, price, is_active)
        VALUES ($1, $2, $2, $3, $4, $5)
        RETURNING id, name, title, description, price, is_active, created_at
      `, [coach_id, name, description, price || 0, true])
    }

    const newProgram = result.rows[0]
    
    return NextResponse.json({
      success: true,
      program: {
        id: newProgram.id,
        name: newProgram.name,
        description: newProgram.description,
        price: parseFloat(newProgram.price),
        duration_days: hasDurationColumn ? (parseInt(newProgram.duration_days) || 30) : 30,
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