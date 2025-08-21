const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function fixTaskCompletion() {
  try {
    console.log('🔧 Fixing task completion status based on file requirements...')
    
    // Get all tasks that require upload
    const tasksRequiringUpload = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.requires_upload,
        t.milestone_id
      FROM tasks t
      WHERE t.requires_upload = true
      ORDER BY t.milestone_id, t.order_index
    `)
    
    console.log(`Found ${tasksRequiringUpload.rows.length} tasks requiring upload`)
    
    let updatedCount = 0
    
    for (const task of tasksRequiringUpload.rows) {
      console.log(`\nChecking task: ${task.title} (ID: ${task.id})`)
      
      // Check if this task has uploaded files
      const filesResult = await pool.query(`
        SELECT COUNT(*) as file_count
        FROM task_files 
        WHERE task_id = $1
      `, [task.id])
      
      const fileCount = parseInt(filesResult.rows[0]?.file_count || '0')
      console.log(`  Files attached: ${fileCount}`)
      
      // Check current completion status for all users
      const taskProgress = await pool.query(`
        SELECT 
          tp.user_id,
          tp.completed,
          u.name as user_name
        FROM task_progress tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.task_id = $1
      `, [task.id])
      
      console.log(`  Users with progress: ${taskProgress.rows.length}`)
      
      for (const progress of taskProgress.rows) {
        const shouldBeCompleted = fileCount > 0
        const currentCompleted = progress.completed
        
        console.log(`    User ${progress.user_name} (${progress.user_id}):`)
        console.log(`      Current status: ${currentCompleted ? 'completed' : 'not completed'}`)
        console.log(`      Should be: ${shouldBeCompleted ? 'completed' : 'not completed'}`)
        
        // Update if status is incorrect
        if (currentCompleted !== shouldBeCompleted) {
          if (shouldBeCompleted) {
            // Mark as completed
            await pool.query(`
              UPDATE task_progress 
              SET completed = true, completed_at = NOW()
              WHERE user_id = $1 AND task_id = $2
            `, [progress.user_id, task.id])
            console.log(`      ✅ Updated: Marked as completed`)
          } else {
            // Mark as not completed
            await pool.query(`
              UPDATE task_progress 
              SET completed = false, completed_at = NULL
              WHERE user_id = $1 AND task_id = $2
            `, [progress.user_id, task.id])
            console.log(`      ✅ Updated: Marked as not completed`)
          }
          updatedCount++
        } else {
          console.log(`      ✅ Status is correct`)
        }
      }
    }
    
    console.log(`\n🎉 Updated ${updatedCount} task progress records`)
    
    // Show summary of current status
    console.log('\n📊 Current task completion status:')
    const summary = await pool.query(`
      SELECT 
        t.title as task_title,
        t.requires_upload,
        COUNT(tf.id) as file_count,
        COUNT(tp.id) as progress_records,
        COUNT(CASE WHEN tp.completed = true THEN 1 END) as completed_count
      FROM tasks t
      LEFT JOIN task_files tf ON t.id = tf.task_id
      LEFT JOIN task_progress tp ON t.id = tp.task_id
      WHERE t.requires_upload = true
      GROUP BY t.id, t.title, t.requires_upload
      ORDER BY t.milestone_id, t.order_index
    `)
    
    summary.rows.forEach(row => {
      const status = row.completed_count > 0 ? '✅ Has completions' : '⏳ No completions'
      console.log(`  ${row.task_title}: ${status} (${row.file_count} files, ${row.completed_count}/${row.progress_records} users completed)`)
    })
    
  } catch (error) {
    console.error('❌ Error fixing task completion:', error)
  } finally {
    await pool.end()
  }
}

fixTaskCompletion()
