import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; milestoneId: string }> }
) {
  try {
    const { customerId, milestoneId } = await params

    // Verify the customer has access to this milestone and check if it's locked
    const verificationResult = await pool.query(`
      SELECT 
        m.id,
        m.order_index,
        m.program_id
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

    const milestone = verificationResult.rows[0]
    
    // Check if this milestone is locked (requires previous milestone completion)
    if (milestone.order_index > 1) {
      const previousMilestoneCheck = await pool.query(`
        SELECT mp.completed
        FROM milestones m
        LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = $1
        WHERE m.program_id = $2 AND m.order_index = $3
      `, [customerId, milestone.program_id, milestone.order_index - 1])
      
      if (previousMilestoneCheck.rows.length > 0) {
        const previousMilestone = previousMilestoneCheck.rows[0]
        if (!previousMilestone.completed) {
          return NextResponse.json(
            { success: false, error: 'Previous milestone must be completed first' },
            { status: 403 }
          )
        }
      }
    }

    // Check if this milestone was just started (has progress record but not completed)
    const milestoneProgressCheck = await pool.query(`
      SELECT mp.completed, mp.created_at
      FROM milestone_progress mp
      WHERE mp.user_id = $1 AND mp.milestone_id = $2
    `, [customerId, milestoneId])

    // Get tasks for the specific milestone
    const tasksResult = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.order_index,
        t.requires_upload,
        t.created_at
      FROM tasks t
      WHERE t.milestone_id = $1
      ORDER BY t.order_index
    `, [milestoneId])

    // Get files for all tasks in this milestone
    const filesResult = await pool.query(`
      SELECT 
        tf.task_id,
        tf.id as file_id,
        tf.original_name,
        tf.file_name,
        tf.file_path,
        tf.file_size,
        tf.file_type,
        tf.created_at as uploaded_at
      FROM task_files tf
      JOIN tasks t ON tf.task_id = t.id
      WHERE t.milestone_id = $1 AND tf.user_id = $2
    `, [milestoneId, customerId])

    // Create a map of task_id to files
    const filesMap = new Map()
    filesResult.rows.forEach(file => {
      if (!filesMap.has(file.task_id)) {
        filesMap.set(file.task_id, [])
      }
      filesMap.get(file.task_id).push({
        id: file.file_id,
        name: file.original_name,
        filename: file.file_name,
        url: file.file_path,
        size: parseInt(file.file_size), // Convert to number
        type: file.file_type,
        uploadedAt: file.uploaded_at
      })
    })

    const tasks = tasksResult.rows.map(row => {
      // Get files for this task - ONLY from task_files table (customer-specific)
      const taskFiles = filesMap.get(row.id) || []
      
      // Clean the description by removing any [FILES:...] sections
      let cleanDescription = row.description
      if (row.description && row.description.includes('[FILES:')) {
        try {
          // Remove the files section from description for display
          cleanDescription = row.description.replace(/\n\n\[FILES:[\s\S]*?\]$/, '')
        } catch (parseError) {
          console.error('Error cleaning description:', parseError)
          cleanDescription = row.description
        }
      }
      
      return {
        id: row.id,
        title: row.title,
        description: cleanDescription,
        completed: false, // Default to false, will be updated below
        order_index: parseInt(row.order_index),
        milestone_id: parseInt(milestoneId),
        requiresUpload: row.requires_upload,
        created_at: row.created_at,
        completed_at: null, // Will be updated below
        files: taskFiles // Only customer-specific files from task_files table
      }
    })
    
    // Get task completion status for this specific customer from task_progress table
    const taskProgressResult = await pool.query(`
      SELECT tp.task_id, tp.completed, tp.completed_at
      FROM task_progress tp
      WHERE tp.user_id = $1 AND tp.task_id = ANY($2)
    `, [customerId, tasks.map(t => t.id)])
    
    // Create a map of task_id to completion status
    const taskProgressMap = new Map()
    taskProgressResult.rows.forEach(progress => {
      taskProgressMap.set(progress.task_id, {
        completed: progress.completed,
        completed_at: progress.completed_at
      })
    })
    
    // Update tasks with customer-specific completion status
    const tasksWithProgress = tasks.map(task => {
      const progress = taskProgressMap.get(task.id)
      return {
        ...task,
        completed: progress ? progress.completed : false,
        completed_at: progress ? progress.completed_at : null
      }
    })

    return NextResponse.json({
      success: true,
      tasks: tasksWithProgress
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
    const body = await request.json()
    const { taskId, completed } = body
    
    console.log('PATCH request body:', body)
    console.log('taskId:', taskId, 'type:', typeof taskId)
    console.log('completed:', completed, 'type:', typeof completed)

    if (taskId === undefined || taskId === null || typeof completed !== 'boolean') {
      console.log('Validation failed:', { taskId, completed })
      return NextResponse.json(
        { success: false, error: 'Task ID and completed status are required' },
        { status: 400 }
      )
    }

    // Verify the customer has access to this milestone and task
    const verificationResult = await pool.query(`
      SELECT t.id, t.title, t.requires_upload, t.description
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

    const task = verificationResult.rows[0]

    // If trying to complete a task that requires upload, check if files are uploaded
    if (completed && task.requires_upload) {
      console.log('Task requires upload:', task.title)
      console.log('Task description:', task.description)
      console.log('Task requires_upload value:', task.requires_upload)
      
      let hasFiles = false
      
      // First, check if files are actually uploaded by querying the task_files table
      try {
        const filesResult = await pool.query(`
          SELECT COUNT(*) as file_count
          FROM task_files 
          WHERE task_id = $1 AND user_id = $2
        `, [taskId, customerId])
        
        const fileCount = parseInt(filesResult.rows[0]?.file_count || '0')
        console.log('Files found in task_files table:', fileCount)
        
        if (fileCount > 0) {
          hasFiles = true
        }
      } catch (error) {
        console.log('task_files table query failed, checking description fallback:', error)
      }
      
      // If no files found in task_files table, check description as fallback
      if (!hasFiles && task.description && task.description.includes('[FILES:')) {
        try {
          const filesMatch = task.description.match(/\[FILES:([\s\S]*?)\]$/)
          if (filesMatch) {
            const files = JSON.parse(filesMatch[1])
            if (files && files.length > 0) {
              console.log('Files found in description fallback:', files.length)
              console.log('Files from description:', files)
              hasFiles = true
            }
          }
        } catch (parseError) {
          console.error('Error parsing files from description:', parseError)
        }
      }
      
      console.log('Final hasFiles result:', hasFiles)
      
      if (!hasFiles) {
        console.log('Upload validation failed for task:', task.title)
        return NextResponse.json(
          { 
            success: false, 
            error: `Cannot complete task "${task.title}". This task requires file upload but no files are attached. Please upload the required file first.`
          },
          { status: 400 }
        )
      }
      
      console.log('File validation passed for task:', task.title)
    }

    // Update or insert the task completion status in task_progress table
    const upsertResult = await pool.query(`
      INSERT INTO task_progress (user_id, task_id, completed, completed_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, task_id) 
      DO UPDATE SET 
        completed = EXCLUDED.completed,
        completed_at = EXCLUDED.completed_at
      RETURNING id, completed, completed_at
    `, [customerId, taskId, completed, completed ? new Date().toISOString() : null])

    if (upsertResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update task progress' },
        { status: 500 }
      )
    }

    const updatedProgress = upsertResult.rows[0]
    
    // Debug: Log the task progress update
    console.log('Task progress updated:', {
      taskId,
      customerId,
      requestedCompleted: completed,
      actualCompleted: updatedProgress.completed,
      completedAt: updatedProgress.completed_at
    })

    return NextResponse.json({
      success: true,
      task: {
        id: taskId,
        title: task.title,
        completed: updatedProgress.completed,
        completed_at: updatedProgress.completed_at
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
