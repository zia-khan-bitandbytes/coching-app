const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function fixMilestoneCompletion() {
  try {
    console.log('🔧 Fixing milestone completion status based on task completion...')
    
    // Get all milestone progress records
    const milestoneProgress = await pool.query(`
      SELECT 
        mp.id,
        mp.user_id,
        mp.milestone_id,
        mp.completed as current_completed,
        mp.started_at,
        mp.completed_at
      FROM milestone_progress mp
      ORDER BY mp.user_id, mp.milestone_id
    `)
    
    console.log(`Found ${milestoneProgress.rows.length} milestone progress records`)
    
    let updatedCount = 0
    
    for (const progress of milestoneProgress.rows) {
      // Count total tasks and completed tasks for this milestone
      const taskCount = await pool.query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN tp.completed = true THEN 1 END) as completed_tasks
        FROM tasks t
        LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.user_id = $1
        WHERE t.milestone_id = $2
      `, [progress.user_id, progress.milestone_id])
      
      const { total_tasks, completed_tasks } = taskCount.rows[0]
      const shouldBeCompleted = total_tasks > 0 && completed_tasks === total_tasks
      
      console.log(`Milestone ${progress.milestone_id} for user ${progress.user_id}:`)
      console.log(`  Total tasks: ${total_tasks}, Completed: ${completed_tasks}`)
      console.log(`  Current status: ${progress.current_completed ? 'completed' : 'not completed'}`)
      console.log(`  Should be: ${shouldBeCompleted ? 'completed' : 'not completed'}`)
      
      // Update if status is incorrect
      if (progress.current_completed !== shouldBeCompleted) {
        if (shouldBeCompleted) {
          // Mark as completed and set completion date if not set
          const completionDate = progress.completed_at || new Date().toISOString()
          await pool.query(`
            UPDATE milestone_progress 
            SET completed = true, completed_at = $1
            WHERE id = $2
          `, [completionDate, progress.id])
          console.log(`  ✅ Updated: Marked as completed`)
        } else {
          // Mark as not completed
          await pool.query(`
            UPDATE milestone_progress 
            SET completed = false, completed_at = NULL
            WHERE id = $1
          `, [progress.id])
          console.log(`  ✅ Updated: Marked as not completed`)
        }
        updatedCount++
      } else {
        console.log(`  ✅ Status is correct`)
      }
    }
    
    console.log(`\n🎉 Updated ${updatedCount} milestone progress records`)
    
    // Show summary of current status
    console.log('\n📊 Current milestone completion status:')
    const summary = await pool.query(`
      SELECT 
        u.name as customer_name,
        m.title as milestone_title,
        mp.completed,
        mp.started_at,
        mp.completed_at,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN tp.completed = true THEN 1 END) as completed_tasks
      FROM milestone_progress mp
      JOIN users u ON mp.user_id = u.id
      JOIN milestones m ON mp.milestone_id = m.id
      LEFT JOIN tasks t ON m.id = t.milestone_id
      LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.user_id = mp.user_id
      GROUP BY u.name, m.title, mp.completed, mp.started_at, mp.completed_at
      ORDER BY u.name, m.order_index
    `)
    
    summary.rows.forEach(row => {
      const status = row.completed ? '✅ Completed' : '⏳ In Progress'
      console.log(`  ${row.customer_name}: ${row.milestone_title} - ${status} (${row.completed_tasks}/${row.total_tasks} tasks)`)
    })
    
  } catch (error) {
    console.error('❌ Error fixing milestone completion:', error)
  } finally {
    await pool.end()
  }
}

fixMilestoneCompletion()