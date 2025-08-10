import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string; milestoneId: string } }
) {
  try {
    const { customerId, milestoneId } = params
    const { completed, notes } = await request.json()

    // Verify the customer exists
    const customerCheck = await pool.query(`
      SELECT id FROM users WHERE id = $1 AND role = 'customer'
    `, [customerId])

    if (customerCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify the milestone exists and customer is enrolled in the program
    const milestoneCheck = await pool.query(`
      SELECT m.id, m.title, cp.name as program_name
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      JOIN user_programs up ON cp.id = up.program_id
      WHERE m.id = $1 AND up.user_id = $2 AND up.status = 'active'
    `, [milestoneId, customerId])

    if (milestoneCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found or customer not enrolled in program' },
        { status: 404 }
      )
    }

    // Update or create milestone progress
    const progressResult = await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, completed, notes, completed_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, milestone_id) 
      DO UPDATE SET 
        completed = $3, 
        notes = $4, 
        completed_at = CASE WHEN $3 = true THEN $5 ELSE NULL END
      RETURNING id, completed, completed_at, notes
    `, [customerId, milestoneId, completed, notes, completed ? new Date() : null])

    const progress = progressResult.rows[0]

    return NextResponse.json({
      success: true,
      message: completed ? 'Milestone marked as completed' : 'Milestone progress updated',
      progress: {
        id: progress.id,
        milestone_id: milestoneId,
        completed: progress.completed,
        completed_at: progress.completed_at,
        notes: progress.notes
      },
      milestone: {
        title: milestoneCheck.rows[0].title,
        program_name: milestoneCheck.rows[0].program_name
      }
    })
  } catch (error) {
    console.error('Error updating milestone progress:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update milestone progress' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string; milestoneId: string } }
) {
  try {
    const { customerId, milestoneId } = params

    // Get milestone progress for the customer
    const progressResult = await pool.query(`
      SELECT 
        mp.id,
        mp.completed,
        mp.completed_at,
        mp.notes,
        mp.created_at,
        m.title as milestone_title,
        m.description as milestone_description,
        m.order_index,
        cp.name as program_name,
        cp.id as program_id
      FROM milestone_progress mp
      JOIN milestones m ON mp.milestone_id = m.id
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE mp.user_id = $1 AND mp.milestone_id = $2
    `, [customerId, milestoneId])

    if (progressResult.rows.length === 0) {
      // Return milestone info without progress if no progress exists
      const milestoneInfo = await pool.query(`
        SELECT 
          m.id,
          m.title,
          m.description,
          m.order_index,
          cp.name as program_name,
          cp.id as program_id
        FROM milestones m
        JOIN coaching_programs cp ON m.program_id = cp.id
        JOIN user_programs up ON cp.id = up.program_id
        WHERE m.id = $1 AND up.user_id = $2 AND up.status = 'active'
      `, [milestoneId, customerId])

      if (milestoneInfo.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Milestone not found or customer not enrolled in program' },
          { status: 404 }
        )
      }

      const milestone = milestoneInfo.rows[0]
      return NextResponse.json({
        success: true,
        progress: {
          milestone_id: milestoneId,
          completed: false,
          completed_at: null,
          notes: null,
          created_at: null
        },
        milestone: {
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          order_index: parseInt(milestone.order_index),
          program_name: milestone.program_name,
          program_id: milestone.program_id
        }
      })
    }

    const progress = progressResult.rows[0]

    return NextResponse.json({
      success: true,
      progress: {
        id: progress.id,
        milestone_id: milestoneId,
        completed: progress.completed,
        completed_at: progress.completed_at,
        notes: progress.notes,
        created_at: progress.created_at
      },
      milestone: {
        id: progress.milestone_id,
        title: progress.milestone_title,
        description: progress.milestone_description,
        order_index: parseInt(progress.order_index),
        program_name: progress.program_name,
        program_id: progress.program_id
      }
    })
  } catch (error) {
    console.error('Error fetching milestone progress:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestone progress' },
      { status: 500 }
    )
  }
} 