import pool from '../lib/db'

async function checkDatabase() {
  try {
    console.log('Checking database structure...')
    
    // Check if tasks table exists
    const tasksTableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'tasks'
    `)
    
    console.log('Tasks table exists:', tasksTableResult.rows.length > 0)
    
    if (tasksTableResult.rows.length > 0) {
      // Check tasks table structure
      const tasksStructureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'tasks'
        ORDER BY ordinal_position
      `)
      
      console.log('Tasks table structure:')
      tasksStructureResult.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
      })
      
      // Check if there are any tasks
      const tasksCountResult = await pool.query('SELECT COUNT(*) as count FROM tasks')
      console.log('Total tasks in database:', tasksCountResult.rows[0].count)
      
      // Check recent tasks
      const recentTasksResult = await pool.query(`
        SELECT id, title, milestone_id, created_at 
        FROM tasks 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      console.log('Recent tasks:')
      recentTasksResult.rows.forEach(task => {
        console.log(`  ID: ${task.id}, Title: ${task.title}, Milestone: ${task.milestone_id}, Created: ${task.created_at}`)
      })
    }
    
    // Check milestones table
    const milestonesResult = await pool.query('SELECT COUNT(*) as count FROM milestones')
    console.log('Total milestones in database:', milestonesResult.rows[0].count)
    
    // Check coaching_programs table
    const programsResult = await pool.query('SELECT COUNT(*) as count FROM coaching_programs')
    console.log('Total programs in database:', programsResult.rows[0].count)
    
  } catch (error) {
    console.error('Error checking database:', error)
  } finally {
    await pool.end()
  }
}

checkDatabase() 