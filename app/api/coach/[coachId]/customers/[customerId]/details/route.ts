import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string; customerId: string }> }
) {
  try {
    const { coachId, customerId } = await params
    console.log('Customer details API called with:', { coachId, customerId })

    if (!coachId || !customerId) {
      return NextResponse.json(
        { success: false, error: 'Coach ID and Customer ID are required' },
        { status: 400 }
      )
    }

    // Verify the customer belongs to the coach
    const customerCheck = await pool.query(`
      SELECT cc.customer_id, u.name, u.email
      FROM coach_customers cc
      JOIN users u ON cc.customer_id = u.id
      WHERE cc.coach_id = $1 AND cc.customer_id = $2
    `, [coachId, customerId])

    console.log('Customer check result:', customerCheck.rows)

    if (customerCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found or access denied' },
        { status: 404 }
      )
    }

    const customerInfo = customerCheck.rows[0]
    console.log('Customer info:', customerInfo)

    // Get customer's enrolled programs with detailed information
    const programsResult = await pool.query(`
      SELECT 
        cp.id,
        cp.name,
        cp.description,
        cp.price,
        up.status as enrollment_status,
        up.enrolled_at,
        COUNT(DISTINCT m.id) as milestones_count,
        COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.milestone_id END) as completed_milestones
      FROM user_programs up
      JOIN coaching_programs cp ON up.program_id = cp.id
      LEFT JOIN milestones m ON cp.id = m.program_id
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = up.user_id
      WHERE up.user_id = $1 AND cp.coach_id = $2
      GROUP BY cp.id, cp.name, cp.description, cp.price, up.status, up.enrolled_at
      ORDER BY up.enrolled_at DESC
    `, [customerId, coachId])

    console.log('Programs result:', programsResult.rows)
    const programs = []
    
    // For each program, get detailed milestone and task information
    for (const program of programsResult.rows) {
      // Get milestones for this program
      const milestonesResult = await pool.query(`
        SELECT 
          m.id,
          m.title,
          m.description,
          m.goal_days,
          m.order_index,
          mp.completed,
          mp.created_at as started_at,
          mp.completed_at,
          CASE 
            WHEN mp.completed = true THEN 'completed'
            WHEN mp.created_at IS NOT NULL THEN 'in-progress'
            ELSE 'upcoming'
          END as status,
          CASE 
            WHEN mp.completed = true AND mp.created_at IS NOT NULL THEN
              EXTRACT(EPOCH FROM (mp.completed_at - mp.created_at)) / 86400
            ELSE NULL
          END as completion_days
        FROM milestones m
        LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = $1
        LEFT JOIN user_programs up ON up.program_id = m.program_id AND up.user_id = $1
        WHERE m.program_id = $2
        ORDER BY m.order_index
      `, [customerId, program.id])

      const milestones = []
      
      // For each milestone, get tasks
      for (const milestone of milestonesResult.rows) {
        let tasks = []
        
        try {
          const tasksResult = await pool.query(`
            SELECT 
              t.id,
              t.title,
              t.description,
              tp.completed,
              tp.completed_at,
              t.requires_upload
            FROM tasks t
            LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.user_id = $1
            WHERE t.milestone_id = $2
            ORDER BY t.order_index
          `, [customerId, milestone.id])

          // For each task, get files if it has uploads
          for (const task of tasksResult.rows) {
            let files = []
            
            if (task.requires_upload) {
              try {
                // Check if task_files table exists first
                const tableCheck = await pool.query(`
                  SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'task_files'
                  )
                `)
                
                if (tableCheck.rows[0]?.exists) {
                  // Use task_files table instead of files table
                  const filesResult = await pool.query(`
                    SELECT 
                      id,
                      file_name as filename,
                      original_name,
                      file_size,
                      created_at as uploaded_at,
                      file_path as url
                    FROM task_files
                    WHERE user_id = $1 AND task_id = $2
                    ORDER BY created_at DESC
                  `, [customerId, task.id])
                  
                  files = filesResult.rows.map(file => ({
                    ...file,
                    // Convert file_path to a proper URL if needed
                    url: file.url.startsWith('http') ? file.url : `/api/files/${file.url}`
                  }))
                }
              } catch (fileError) {
                console.log('File fetching error (non-critical):', fileError)
                files = []
              }
            }

            tasks.push({
              ...task,
              files
            })
          }
        } catch (taskError) {
          console.log('Task fetching error (non-critical):', taskError)
          tasks = []
        }

        // Calculate milestone completion based on tasks, not milestone_progress.completed
        const totalTasks = tasks.length
        const completedTasks = tasks.filter(task => task.completed).length
        const isMilestoneCompleted = totalTasks > 0 && completedTasks === totalTasks
        
        // Determine milestone status based on task completion
        let milestoneStatus = 'upcoming'
        if (milestone.started_at) {
          if (isMilestoneCompleted) {
            milestoneStatus = 'completed'
          } else if (completedTasks > 0) {
            milestoneStatus = 'in-progress'
          } else {
            milestoneStatus = 'in-progress'
          }
        }

        milestones.push({
          ...milestone,
          completed: isMilestoneCompleted, // Override with calculated completion
          status: milestoneStatus, // Use calculated status
          tasks
        })
      }

      programs.push({
        ...program,
        milestones
      })
    }

    // Calculate summary statistics
    const totalPrograms = programs.length
    const activePrograms = programs.filter(p => p.enrollment_status === 'active').length
    const completedMilestones = programs.reduce((sum, p) => sum + parseInt(p.completed_milestones), 0)
    const totalSpent = programs.reduce((sum, p) => sum + parseFloat(p.price), 0)

    // Get last activity (most recent milestone completion or enrollment)
    const lastActivityResult = await pool.query(`
      SELECT 
        GREATEST(
          COALESCE(MAX(mp.completed_at), '1970-01-01'),
          COALESCE(MAX(up.enrolled_at), '1970-01-01')
        ) as last_activity
      FROM user_programs up
      LEFT JOIN milestone_progress mp ON up.user_id = mp.user_id
      WHERE up.user_id = $1
    `, [customerId])

    const lastActivity = lastActivityResult.rows[0]?.last_activity || new Date().toISOString()

    const customerDetails = {
      id: parseInt(customerId),
      name: customerInfo.name,
      email: customerInfo.email,
      enrolled_programs: programs,
      total_programs: totalPrograms,
      active_programs: activePrograms,
      completed_milestones: completedMilestones,
      total_spent: totalSpent,
      last_activity: lastActivity
    }

    return NextResponse.json({
      success: true,
      customer: customerDetails
    })
  } catch (error) {
    console.error('Error fetching customer details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer details' },
      { status: 500 }
    )
  }
}
