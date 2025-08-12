import pool from '../lib/db'

async function migrateRequiresUpload() {
  try {
    console.log('Starting migration: Adding requires_upload column to tasks table...')
    
    // Check if the column already exists
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'requires_upload'
    `)
    
    if (checkColumnResult.rows.length > 0) {
      console.log('Column requires_upload already exists. Skipping migration.')
      return
    }
    
    // Add the requires_upload column
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN requires_upload BOOLEAN DEFAULT FALSE
    `)
    
    console.log('Successfully added requires_upload column to tasks table.')
    
    // Update existing tasks to have requires_upload = false by default
    const updateResult = await pool.query(`
      UPDATE tasks 
      SET requires_upload = FALSE 
      WHERE requires_upload IS NULL
    `)
    
    console.log(`Updated ${updateResult.rowCount} existing tasks with default requires_upload value.`)
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run the migration
migrateRequiresUpload()
  .then(() => {
    console.log('Migration completed successfully.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  }) 