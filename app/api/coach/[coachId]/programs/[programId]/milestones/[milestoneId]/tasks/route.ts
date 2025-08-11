import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string; milestoneId: string } }
) {
  try {
    const { coachId, programId, milestoneId } = await params

    // Verify the program belongs to the coach and milestone belongs to program
    const verificationResult = await pool.query(`
      SELECT m.id 
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE m.id = $1 AND cp.id = $2 AND cp.coach_id = $3
    `, [milestoneId, programId, coachId])

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
      created_at: row.created_at,
      completed_at: row.completed_at
    }))

    return NextResponse.json({
      success: true,
      tasks: tasks
    })
  } catch (error) {
    console.error('Error fetching milestone tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestone tasks' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string; milestoneId: string } }
) {
  try {
    const { coachId, programId, milestoneId } = await params
    const { title, description } = await request.json()

    // Verify the program belongs to the coach and milestone belongs to program
    const verificationResult = await pool.query(`
      SELECT m.id 
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE m.id = $1 AND cp.id = $2 AND cp.coach_id = $3
    `, [milestoneId, programId, coachId])

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found or access denied' },
        { status: 404 }
      )
    }

    // Get the next order_index by finding the max existing order_index for this milestone
    const maxOrderResult = await pool.query(`
      SELECT COALESCE(MAX(order_index), 0) as max_order 
      FROM tasks 
      WHERE milestone_id = $1
    `, [milestoneId])
    
    const nextOrderIndex = maxOrderResult.rows[0].max_order + 1

    // Create new task with auto-incremented order_index
    const result = await pool.query(`
      INSERT INTO tasks (milestone_id, title, description, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, completed, order_index, created_at
    `, [milestoneId, title, description, nextOrderIndex])

    const newTask = result.rows[0]

    return NextResponse.json({
      success: true,
      task: {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        completed: newTask.completed,
        order_index: parseInt(newTask.order_index),
        milestone_id: parseInt(milestoneId),
        created_at: newTask.created_at
      }
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string; milestoneId: string } }
) {
  try {
    const { coachId, programId, milestoneId } = await params
    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Verify the program belongs to the coach and task belongs to milestone
    const verificationResult = await pool.query(`
      SELECT t.id 
      FROM tasks t
      JOIN milestones m ON t.milestone_id = m.id
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE t.id = $1 AND m.id = $2 AND cp.id = $3 AND cp.coach_id = $4
    `, [taskId, milestoneId, programId, coachId])

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the task
    await pool.query(`
      DELETE FROM tasks 
      WHERE id = $1 AND milestone_id = $2
    `, [taskId, milestoneId])

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}