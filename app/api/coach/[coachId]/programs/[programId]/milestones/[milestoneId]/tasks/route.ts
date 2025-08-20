import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string; programId: string; milestoneId: string }> }
) {
  try {
    const { coachId, programId, milestoneId } = await params

    if (!coachId || !programId || !milestoneId) {
      return NextResponse.json(
        { success: false, error: 'Coach ID, Program ID, and Milestone ID are required' },
        { status: 400 }
      )
    }

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
        t.id,
        t.title,
        t.description,
        t.completed,
        t.order_index,
        t.requires_upload,
        t.created_at,
        t.completed_at
      FROM tasks t
      WHERE t.milestone_id = $1
      ORDER BY t.order_index
    `, [milestoneId])

    // Get files for each task
    const tasks = await Promise.all(tasksResult.rows.map(async (row) => {
      // Fetch files from task_files table
      let files = []
      try {
        const filesResult = await pool.query(`
          SELECT 
            id,
            file_name,
            original_name,
            file_path,
            file_size,
            file_type,
            uploaded_by,
            created_at
          FROM task_files 
          WHERE task_id = $1
          ORDER BY created_at DESC
        `, [row.id])
        
        files = filesResult.rows.map(fileRow => ({
          id: fileRow.id,
          name: fileRow.original_name,
          size: parseInt(fileRow.file_size),
          type: fileRow.file_type,
          url: `/api/files/${fileRow.file_path}`,
          uploadedAt: fileRow.created_at
        }))
      } catch (error) {
        console.error('Error fetching files for task:', row.id, error)
        // If task_files table doesn't exist, try to parse from description as fallback
        if (row.description && row.description.includes('[FILES:')) {
          try {
            const filesMatch = row.description.match(/\[FILES:(.*?)\]$/)
            if (filesMatch) {
              files = JSON.parse(filesMatch[1])
              // Remove the files section from description
              row.description = row.description.replace(/\n\n\[FILES:.*?\]$/, '')
            }
          } catch (parseError) {
            console.error('Error parsing files from description:', parseError)
          }
        }
      }
      
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        completed: row.completed,
        order_index: parseInt(row.order_index),
        milestone_id: parseInt(milestoneId),
        requiresUpload: row.requires_upload,
        created_at: row.created_at,
        completed_at: row.completed_at,
        files: files
      }
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
    const { title, description, requiresUpload, uploadedFiles } = await request.json()
    
    console.log('Creating task with params:', { coachId, programId, milestoneId, title, description, requiresUpload })

    // Verify the program belongs to the coach and milestone belongs to program
    console.log('Verifying with params:', { milestoneId, programId, coachId })
    
    const verificationResult = await pool.query(`
      SELECT m.id 
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE m.id = $1 AND cp.id = $2 AND cp.coach_id = $3
    `, [milestoneId, programId, coachId])

    console.log('Verification result:', verificationResult.rows)

    if (verificationResult.rows.length === 0) {
      console.log('Milestone not found or access denied')
      
      // Let's check what milestones exist for this program
      const milestoneCheckResult = await pool.query(`
        SELECT m.id, m.title, cp.coach_id
        FROM milestones m
        JOIN coaching_programs cp ON m.program_id = cp.id
        WHERE cp.id = $1
      `, [programId])
      
      console.log('Available milestones for this program:', milestoneCheckResult.rows)
      
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

    // Start a transaction to ensure data consistency
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // If there are uploaded files, store them in the description field
      let taskFiles = []
      let taskDescription = description
      
      if (uploadedFiles && uploadedFiles.length > 0) {
        console.log('Processing uploaded files:', uploadedFiles)
        
        // Create file objects for storage
        taskFiles = uploadedFiles.map((file: any, index: number) => {
          console.log('Processing file:', file)
          console.log('File URL:', file.url)
          const fileObj = {
            id: Date.now() + index,
            name: file.name,
            size: file.size,
            type: file.type,
            url: file.url,
            uploadedAt: new Date().toISOString()
          }
          console.log('Created file object:', fileObj)
          return fileObj
        })
        
        // Store files info in description as JSON
        const filesInfo = JSON.stringify(taskFiles)
        taskDescription = `${description}\n\n[FILES:${filesInfo}]`
        console.log('Storing files in description:', taskDescription)
      }

      // Create new task with auto-incremented order_index
      console.log('Creating task with values:', { milestoneId, title, taskDescription, nextOrderIndex, requiresUpload })
      
      const result = await client.query(`
        INSERT INTO tasks (milestone_id, title, description, order_index, requires_upload)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, description, completed, order_index, requires_upload, created_at
      `, [milestoneId, title, taskDescription, nextOrderIndex, requiresUpload || false])

      const newTask = result.rows[0]
      console.log('Task created successfully:', newTask)

      await client.query('COMMIT')
      console.log('Transaction committed successfully')

      const responseTask = {
        id: newTask.id,
        title: newTask.title,
        description: description, // Use the original description, not the one with files
        completed: newTask.completed,
        order_index: parseInt(newTask.order_index),
        milestone_id: parseInt(milestoneId),
        requiresUpload: newTask.requires_upload,
        created_at: newTask.created_at,
        files: taskFiles
      }
      
      console.log('Returning task:', responseTask)

      return NextResponse.json({
        success: true,
        task: responseTask
      })
    } catch (error) {
      console.error('Transaction error:', error)
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string; programId: string; milestoneId: string }> }
) {
  try {
    const { coachId, programId, milestoneId } = await params
    
    if (!coachId || !programId || !milestoneId) {
      return NextResponse.json(
        { success: false, error: 'Coach ID, Program ID, and Milestone ID are required' },
        { status: 400 }
      )
    }
    
    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    const { title, description, requiresUpload } = await request.json()
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Task title is required' },
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

    // Update the task
    const result = await pool.query(`
      UPDATE tasks 
      SET title = $1, description = $2, requires_upload = $3
      WHERE id = $4 AND milestone_id = $5
      RETURNING id, title, description, completed, order_index, requires_upload, created_at, completed_at
    `, [title.trim(), description?.trim() || null, requiresUpload || false, taskId, milestoneId])

    const updatedTask = result.rows[0]

    return NextResponse.json({
      success: true,
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        completed: updatedTask.completed,
        order_index: parseInt(updatedTask.order_index),
        milestone_id: parseInt(milestoneId),
        requiresUpload: updatedTask.requires_upload,
        created_at: updatedTask.created_at,
        completed_at: updatedTask.completed_at
      }
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { coachId: string; programId: string; milestoneId: string } }
) {
  try {
    const { coachId, programId, milestoneId } = await params
    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    const { completed } = await request.json()
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Completed status is required and must be a boolean' },
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

    // Update the task completion status
    const result = await pool.query(`
      UPDATE tasks 
      SET completed = $1, completed_at = $2
      WHERE id = $3 AND milestone_id = $4
      RETURNING id, title, description, completed, order_index, requires_upload, created_at, completed_at
    `, [completed, completed ? new Date().toISOString() : null, taskId, milestoneId])

    const updatedTask = result.rows[0]

    return NextResponse.json({
      success: true,
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        completed: updatedTask.completed,
        order_index: parseInt(updatedTask.order_index),
        milestone_id: parseInt(milestoneId),
        requiresUpload: updatedTask.requires_upload,
        created_at: updatedTask.created_at,
        completed_at: updatedTask.completed_at
      }
    })
  } catch (error) {
    console.error('Error updating task completion:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task completion' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string; programId: string; milestoneId: string }> }
) {
  try {
    const { coachId, programId, milestoneId } = await params
    
    if (!coachId || !programId || !milestoneId) {
      return NextResponse.json(
        { success: false, error: 'Coach ID, Program ID, and Milestone ID are required' },
        { status: 400 }
      )
    }
    
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

    // Start a transaction to ensure data consistency
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // Delete the task
      await client.query(`
        DELETE FROM tasks 
        WHERE id = $1 AND milestone_id = $2
      `, [taskId, milestoneId])

      // Get all remaining tasks for this milestone, ordered by current order_index
      const remainingTasksResult = await client.query(`
        SELECT id, order_index 
        FROM tasks 
        WHERE milestone_id = $1 
        ORDER BY order_index
      `, [milestoneId])

      // Reorder the remaining tasks sequentially starting from 1
      if (remainingTasksResult.rows.length > 0) {
        for (let i = 0; i < remainingTasksResult.rows.length; i++) {
          const task = remainingTasksResult.rows[i]
          const newOrderIndex = i + 1
          
          // Only update if the order_index has changed
          if (task.order_index !== newOrderIndex) {
            await client.query(`
              UPDATE tasks 
              SET order_index = $1 
              WHERE id = $2
            `, [newOrderIndex, task.id])
          }
        }
      }

      await client.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: 'Task deleted successfully and order corrected'
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}