import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string; milestoneId: string } }
) {
  try {
    const { customerId, milestoneId } = await params
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
      SELECT m.id, m.title, m.order_index, cp.name as program_name, cp.id as program_id, cp.coach_id
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

    const milestone = milestoneCheck.rows[0]

    // If trying to complete a milestone, validate the sequence and task completion
    if (completed) {
      // Check if all previous milestones are completed
      if (milestone.order_index > 1) {
        const previousMilestonesCheck = await pool.query(`
          SELECT m.id, m.title, m.order_index, mp.completed
          FROM milestones m
          LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = $1
          WHERE m.program_id = $2 
            AND m.order_index < $3
            AND (mp.completed IS NULL OR mp.completed = false)
          ORDER BY m.order_index
        `, [customerId, milestone.program_id, milestone.order_index])

        if (previousMilestonesCheck.rows.length > 0) {
          const incompleteMilestones = previousMilestonesCheck.rows
            .map(m => ({ id: m.id, title: m.title, order_index: m.order_index }))
            .sort((a, b) => a.order_index - b.order_index)

          return NextResponse.json(
            { 
              success: false, 
              error: `Cannot complete milestone "${milestone.title}". You must complete the previous milestone(s) first.`,
              incompleteMilestones: incompleteMilestones
            },
            { status: 400 }
          )
        }
      }

      // Check if all tasks are completed and required files are uploaded
      const tasksCheck = await pool.query(`
        SELECT t.id, t.title, t.completed, t.requires_upload, t.description
        FROM tasks t
        WHERE t.milestone_id = $1
        ORDER BY t.order_index
      `, [milestoneId])

      if (tasksCheck.rows.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Cannot complete milestone "${milestone.title}". No tasks found.`
          },
          { status: 400 }
        )
      }

      // Check each task
      for (const task of tasksCheck.rows) {
        if (!task.completed) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Cannot complete milestone "${milestone.title}". Task "${task.title}" is not completed.`
            },
            { status: 400 }
          )
        }

        // If task requires upload, check if files are uploaded
        if (task.requires_upload) {
          // Check if files are attached to the task description
          if (!task.description || !task.description.includes('[FILES:')) {
            return NextResponse.json(
              { 
                success: false, 
                error: `Cannot complete milestone "${milestone.title}". Task "${task.title}" requires file upload but no files are attached.`
              },
              { status: 400 }
            )
          }

          // Parse files to ensure they exist
          try {
            const filesMatch = task.description.match(/\[FILES:([\s\S]*?)\]$/)
            if (filesMatch) {
              const files = JSON.parse(filesMatch[1])
              if (!files || files.length === 0) {
                return NextResponse.json(
                  { 
                    success: false, 
                    error: `Cannot complete milestone "${milestone.title}". Task "${task.title}" requires file upload but no files are attached.`
                  },
                  { status: 400 }
                )
              }
            } else {
              return NextResponse.json(
                { 
                  success: false, 
                  error: `Cannot complete milestone "${milestone.title}". Task "${task.title}" requires file upload but no files are attached.`
                },
                { status: 400 }
              )
            }
          } catch (error) {
            return NextResponse.json(
              { 
                success: false, 
                error: `Cannot complete milestone "${milestone.title}". Task "${task.title}" has invalid file data.`
              },
              { status: 400 }
            )
          }
        }
      }
    }

    // Check if milestone progress already exists
    const existingProgress = await pool.query(`
      SELECT id, completed, completed_at, notes, created_at
      FROM milestone_progress 
      WHERE user_id = $1 AND milestone_id = $2
    `, [customerId, milestoneId])

    let progressResult
    let isNewMilestone = false

    if (existingProgress.rows.length > 0) {
      // Update existing progress
      progressResult = await pool.query(`
        UPDATE milestone_progress 
        SET 
          completed = $3, 
          notes = $4, 
          completed_at = $5
        WHERE user_id = $1 AND milestone_id = $2
        RETURNING id, completed, completed_at, notes, created_at
      `, [customerId, milestoneId, completed, notes, completed ? new Date().toISOString() : null])
    } else {
      // Create new progress - this automatically starts the milestone
      isNewMilestone = true
      progressResult = await pool.query(`
        INSERT INTO milestone_progress (user_id, milestone_id, completed, notes, completed_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, completed, completed_at, notes, created_at
      `, [customerId, milestoneId, completed, notes, completed ? new Date().toISOString() : null, new Date().toISOString()])
    }

    const progress = progressResult.rows[0]

    // If this milestone was completed, check if we should unlock the next milestone
    if (completed) {
      const nextMilestoneCheck = await pool.query(`
        SELECT m.id, m.title, m.order_index
        FROM milestones m
        WHERE m.program_id = $1 AND m.order_index = $2
      `, [milestone.program_id, milestone.order_index + 1])

      if (nextMilestoneCheck.rows.length > 0) {
        const nextMilestone = nextMilestoneCheck.rows[0]
        
        // Check if next milestone progress exists, if not create it to unlock it
        const nextMilestoneProgress = await pool.query(`
          SELECT id FROM milestone_progress 
          WHERE user_id = $1 AND milestone_id = $2
        `, [customerId, nextMilestone.id])

        if (nextMilestoneProgress.rows.length === 0) {
          // Create progress record for next milestone to unlock it
          await pool.query(`
            INSERT INTO milestone_progress (user_id, milestone_id, completed, notes, created_at)
            VALUES ($1, $2, false, 'Milestone unlocked by completing previous milestone', $3)
          `, [customerId, nextMilestone.id, new Date().toISOString()])
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: completed ? 'Milestone marked as completed' : 'Milestone progress updated',
      progress: {
        id: progress.id,
        milestone_id: milestoneId,
        completed: progress.completed,
        completed_at: progress.completed_at,
        notes: progress.notes,
        started_at: progress.created_at
      },
      milestone: {
        title: milestone.title,
        program_name: milestone.program_name,
        order_index: milestone.order_index
      },
      isNewMilestone,
      nextMilestoneUnlocked: completed
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
    const { customerId, milestoneId } = await params

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