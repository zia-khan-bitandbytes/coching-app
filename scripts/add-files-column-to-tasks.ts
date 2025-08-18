import pool from '../lib/db'

async function addFilesColumnToTasks() {
  try {
    console.log('Adding files column to tasks table...')
    
    // Check if the files column already exists
    const columnExistsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'files'
    `)
    
    if (columnExistsResult.rows.length > 0) {
      console.log('files column already exists in tasks table')
      return
    }
    
    // Add the files column as JSON type
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN files JSONB DEFAULT '[]'::jsonb
    `)
    
    console.log('✅ files column added successfully to tasks table!')
    
    // Verify the column was added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'files'
    `)
    
    if (verifyResult.rows.length > 0) {
      console.log('Column verification:', verifyResult.rows[0])
    } else {
      console.log('❌ Column verification failed')
    }
    
  } catch (error) {
    console.error('❌ Error adding files column:', error)
  } finally {
    await pool.end()
  }
}

addFilesColumnToTasks() 