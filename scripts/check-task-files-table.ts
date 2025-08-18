import pool from '../lib/db'

async function checkTaskFilesTable() {
  try {
    console.log('Checking task_files table structure...')
    
    // Check if task_files table exists
    const tableExistsResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'task_files'
    `)
    
    console.log('task_files table exists:', tableExistsResult.rows.length > 0)
    
    if (tableExistsResult.rows.length > 0) {
      // Check table structure
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'task_files'
        ORDER BY ordinal_position
      `)
      
      console.log('task_files table structure:')
      structureResult.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`)
      })
      
      // Check if there are any files
      const filesCountResult = await pool.query('SELECT COUNT(*) as count FROM task_files')
      console.log('Total files in task_files table:', filesCountResult.rows[0].count)
      
      // Check recent files
      const recentFilesResult = await pool.query(`
        SELECT id, original_name, file_path, task_id, milestone_id, created_at 
        FROM task_files 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      console.log('Recent files in task_files:')
      recentFilesResult.rows.forEach(file => {
        console.log(`  ID: ${file.id}, Name: ${file.original_name}, Task ID: ${file.task_id}, Milestone: ${file.milestone_id}, Created: ${file.created_at}`)
      })
      
      // Check files without task_id
      const orphanedFilesResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM task_files 
        WHERE task_id IS NULL
      `)
      console.log('Files without task_id (orphaned):', orphanedFilesResult.rows[0].count)
      
    } else {
      console.log('task_files table does not exist')
    }
    
  } catch (error) {
    console.error('Error checking task_files table:', error)
  } finally {
    await pool.end()
  }
}

checkTaskFilesTable() 