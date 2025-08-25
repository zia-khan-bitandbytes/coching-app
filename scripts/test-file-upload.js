const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function testFileUpload() {
  try {
    console.log('🔍 Testing file upload functionality...')
    
    // Check current task_files table
    console.log('\n📁 Current task_files table:')
    const currentFiles = await pool.query('SELECT * FROM task_files ORDER BY id')
    console.log(`Found ${currentFiles.rows.length} files`)
    currentFiles.rows.forEach(file => {
      console.log(`  File ${file.id}: ${file.original_name} (Task: ${file.task_id}, User: ${file.user_id})`)
    })
    
    // Check task_progress table
    console.log('\n✅ Current task_progress table:')
    const taskProgress = await pool.query('SELECT * FROM task_progress ORDER BY user_id, task_id')
    console.log(`Found ${taskProgress.rows.length} task progress records`)
    taskProgress.rows.forEach(progress => {
      console.log(`  Task ${progress.task_id} for user ${progress.user_id}: ${progress.completed ? 'completed' : 'not completed'}`)
    })
    
    // Check specific task details
    console.log('\n📋 Task details for milestone 1:')
    const tasks = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.requires_upload,
        t.description
      FROM tasks t
      WHERE t.milestone_id = 1
      ORDER BY t.order_index
    `)
    
    tasks.rows.forEach(task => {
      console.log(`  Task ${task.id}: ${task.title}`)
      console.log(`    Requires upload: ${task.requires_upload}`)
      console.log(`    Description: ${task.description}`)
      
      // Check if this task has files
      pool.query(`
        SELECT COUNT(*) as file_count
        FROM task_files 
        WHERE task_id = $1
      `, [task.id]).then(fileResult => {
        const fileCount = fileResult.rows[0]?.file_count || 0
        console.log(`    Files attached: ${fileCount}`)
      })
    })
    
    // Check milestone_progress
    console.log('\n🎯 Milestone progress for user 3:')
    const milestoneProgress = await pool.query(`
      SELECT 
        mp.milestone_id,
        mp.completed,
        mp.started_at,
        mp.completed_at
      FROM milestone_progress mp
      WHERE mp.user_id = 3
      ORDER BY mp.milestone_id
    `)
    
    milestoneProgress.rows.forEach(mp => {
      console.log(`  Milestone ${mp.milestone_id}: ${mp.completed ? 'completed' : 'not completed'}`)
      console.log(`    Started: ${mp.started_at}`)
      console.log(`    Completed: ${mp.completed_at}`)
    })
    
  } catch (error) {
    console.error('❌ Error testing file upload:', error)
  } finally {
    await pool.end()
  }
}

testFileUpload()
