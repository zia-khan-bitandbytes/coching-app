import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string } }
) {
  try {
    const { coachId, programId } = await params
    
    if (!coachId || !programId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Coach ID and Program ID are required' 
      }, { status: 400 })
    }
    
    // Check if program belongs to the coach
    const programCheck = await pool.query(`
      SELECT id FROM coaching_programs WHERE id = $1 AND coach_id = $2
    `, [programId, coachId])
    
    if (programCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Program not found or access denied' 
      }, { status: 404 })
    }

    // Delete the program (cascading will handle related data)
    // This will automatically delete:
    // - milestones (due to ON DELETE CASCADE)
    // - user_programs enrollments (due to ON DELETE CASCADE)
    // - milestone_progress (due to ON DELETE CASCADE)
    // - payments (due to ON DELETE CASCADE)
    await pool.query(`DELETE FROM coaching_programs WHERE id = $1`, [programId])
    
    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting program:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete program' 
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string } }
) {
  try {
    const { coachId, programId } = await params
    
    if (!coachId || !programId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Coach ID and Program ID are required' 
      }, { status: 400 })
    }
    
    // Get program details
    const result = await pool.query(`
      SELECT id, name, description, price, duration_weeks, is_active, created_at
      FROM coaching_programs 
      WHERE id = $1 AND coach_id = $2
    `, [programId, coachId])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Program not found or access denied' 
      }, { status: 404 })
    }
    
    const program = result.rows[0]
    
    return NextResponse.json({
      success: true,
      program: {
        id: program.id,
        name: program.name,
        description: program.description,
        price: parseFloat(program.price),
        duration_weeks: parseInt(program.duration_weeks),
        is_active: program.is_active,
        created_at: program.created_at
      }
    })
  } catch (error) {
    console.error('Error fetching program:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch program' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string } }
) {
  try {
    const { coachId, programId } = await params
    const { name, description, price, duration_weeks, is_active } = await request.json()
    
    if (!coachId || !programId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Coach ID and Program ID are required' 
      }, { status: 400 })
    }
    
    // Check if program belongs to the coach
    const programCheck = await pool.query(`
      SELECT id FROM coaching_programs WHERE id = $1 AND coach_id = $2
    `, [programId, coachId])
    
    if (programCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Program not found or access denied' 
      }, { status: 404 })
    }

    // Update the program
    const result = await pool.query(`
      UPDATE coaching_programs 
      SET name = COALESCE($1, name), 
          description = COALESCE($2, description), 
          price = COALESCE($3, price), 
          duration_weeks = COALESCE($4, duration_weeks),
          is_active = COALESCE($5, is_active)
      WHERE id = $6
      RETURNING id, name, description, price, duration_weeks, is_active, created_at
    `, [name, description, price, duration_weeks, is_active, programId])

    const updatedProgram = result.rows[0]
    
    return NextResponse.json({
      success: true,
      program: {
        id: updatedProgram.id,
        name: updatedProgram.name,
        description: updatedProgram.description,
        price: parseFloat(updatedProgram.price),
        duration_weeks: parseInt(updatedProgram.duration_weeks),
        is_active: updatedProgram.is_active,
        created_at: updatedProgram.created_at
      }
    })
  } catch (error) {
    console.error('Error updating program:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update program' 
    }, { status: 500 })
  }
}
