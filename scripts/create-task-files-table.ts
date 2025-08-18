import pool from '../lib/db'

async function createTaskFilesTable() {
  try {
    console.log('Creating task_files table...')
    
    // Create the task_files table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_files (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        uploaded_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON task_files(task_id)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_task_files_milestone_id ON task_files(milestone_id)
    `)
    
    console.log('task_files table created successfully!')
    
    // Verify the table was created
    const verifyResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'task_files'
    `)
    
    console.log('Table verification:', verifyResult.rows.length > 0 ? 'SUCCESS' : 'FAILED')
    
  } catch (error) {
    console.error('Error creating task_files table:', error)
  } finally {
    await pool.end()
  }
}

createTaskFilesTable() 