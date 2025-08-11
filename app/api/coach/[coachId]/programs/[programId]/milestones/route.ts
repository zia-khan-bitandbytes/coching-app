import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string } }
) {
  try {
    const { coachId, programId } = await params

    // Verify the program belongs to the coach
    const programCheck = await pool.query(`
      SELECT id FROM coaching_programs 
      WHERE id = $1 AND coach_id = $2
    `, [programId, coachId])

    if (programCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Program not found or access denied' },
        { status: 404 }
      )
    }

    // Get milestones for the specific program
    const milestonesResult = await pool.query(`
      SELECT 
        m.id,
        m.title,
        m.description,
        m.order_index,
        m.created_at,
        COUNT(DISTINCT mp.user_id) as completed_count,
        COUNT(DISTINCT up.user_id) as total_enrolled
      FROM milestones m
      LEFT JOIN user_programs up ON up.program_id = m.program_id AND up.status = 'active'
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.completed = true
      WHERE m.program_id = $1
      GROUP BY m.id, m.title, m.description, m.order_index, m.created_at
      ORDER BY m.order_index
    `, [programId])

    const milestones = milestonesResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      order_index: parseInt(row.order_index),
      created_at: row.created_at,
      completed_count: parseInt(row.completed_count),
      total_enrolled: parseInt(row.total_enrolled),
      completion_rate: row.total_enrolled > 0 
        ? Math.round((row.completed_count / row.total_enrolled) * 100) 
        : 0
    }))

    return NextResponse.json({
      success: true,
      milestones: milestones
    })
  } catch (error) {
    console.error('Error fetching program milestones:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch program milestones' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string } }
) {
  try {
    const { coachId, programId } = await params
    const { title, description } = await request.json()

    // Verify the program belongs to the coach
    const programCheck = await pool.query(`
      SELECT id FROM coaching_programs 
      WHERE id = $1 AND coach_id = $2
    `, [programId, coachId])

    if (programCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Program not found or access denied' },
        { status: 404 }
      )
    }

    // Get the next order_index by finding the max existing order_index for this program
    const maxOrderResult = await pool.query(`
      SELECT COALESCE(MAX(order_index), 0) as max_order 
      FROM milestones 
      WHERE program_id = $1
    `, [programId])
    
    const nextOrderIndex = maxOrderResult.rows[0].max_order + 1

    // Create new milestone with auto-incremented order_index
    const result = await pool.query(`
      INSERT INTO milestones (program_id, title, description, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, order_index, created_at
    `, [programId, title, description, nextOrderIndex])

    const newMilestone = result.rows[0]

    return NextResponse.json({
      success: true,
      milestone: {
        id: newMilestone.id,
        title: newMilestone.title,
        description: newMilestone.description,
        order_index: parseInt(newMilestone.order_index),
        program_id: parseInt(programId),
        created_at: newMilestone.created_at
      }
    })
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string } }
) {
  try {
    const { coachId, programId } = await params
    const url = new URL(request.url)
    const milestoneId = url.searchParams.get('milestoneId')
    
    if (!milestoneId) {
      return NextResponse.json(
        { success: false, error: 'Milestone ID is required' },
        { status: 400 }
      )
    }

    // Verify the program belongs to the coach
    const programCheck = await pool.query(`
      SELECT id FROM coaching_programs 
      WHERE id = $1 AND coach_id = $2
    `, [programId, coachId])

    if (programCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Program not found or access denied' },
        { status: 404 }
      )
    }

    // Verify the milestone belongs to the program
    const milestoneCheck = await pool.query(`
      SELECT id FROM milestones 
      WHERE id = $1 AND program_id = $2
    `, [milestoneId, programId])

    if (milestoneCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the milestone
    await pool.query(`
      DELETE FROM milestones 
      WHERE id = $1 AND program_id = $2
    `, [milestoneId, programId])

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting milestone:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete milestone' },
      { status: 500 }
    )
  }
} 