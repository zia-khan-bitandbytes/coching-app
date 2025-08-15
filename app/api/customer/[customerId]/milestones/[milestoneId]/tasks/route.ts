import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; milestoneId: string }> }
) {
  try {
    const { customerId, milestoneId } = await params

    // Verify the customer has access to this milestone
    const verificationResult = await pool.query(`
      SELECT m.id 
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      JOIN user_programs up ON cp.id = up.program_id
      WHERE m.id = $1 AND up.user_id = $2
    `, [milestoneId, customerId])

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found or access denied' },
        { status: 404 }
      )
    }

    // Get tasks for the specific milestone
    const tasksResult = await pool.query(`
      SELECT 
        id,
        title,
        description,
        completed,
        order_index,
        requires_upload,
        created_at,
        completed_at
      FROM tasks
      WHERE milestone_id = $1
      ORDER BY order_index
    `, [milestoneId])

    const tasks = tasksResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      completed: row.completed,
      order_index: parseInt(row.order_index),
      milestone_id: parseInt(milestoneId),
      requiresUpload: row.requires_upload,
      created_at: row.created_at,
      completed_at: row.completed_at
    }))

    return NextResponse.json({
      success: true,
      tasks: tasks
    })
  } catch (error) {
    console.error('Error fetching customer milestone tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestone tasks' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; milestoneId: string }> }
) {
  try {
    const { customerId, milestoneId } = await params
    const { taskId, completed } = await request.json()

    if (!taskId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Task ID and completed status are required' },
        { status: 400 }
      )
    }

    // Verify the customer has access to this milestone and task
    const verificationResult = await pool.query(`
      SELECT t.id 
      FROM tasks t
      JOIN milestones m ON t.milestone_id = m.id
      JOIN coaching_programs cp ON m.program_id = cp.id
      JOIN user_programs up ON cp.id = up.program_id
      WHERE t.id = $1 AND m.id = $2 AND up.user_id = $3
    `, [taskId, milestoneId, customerId])

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Update the task completion status
    const updateResult = await pool.query(`
      UPDATE tasks 
      SET completed = $1, completed_at = $2
      WHERE id = $3
      RETURNING id, title, completed, completed_at
    `, [completed, completed ? new Date() : null, taskId])

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update task' },
        { status: 500 }
      )
    }

    const updatedTask = updateResult.rows[0]

    return NextResponse.json({
      success: true,
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        completed: updatedTask.completed,
        completed_at: updatedTask.completed_at
      }
    })
  } catch (error) {
    console.error('Error updating customer task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
