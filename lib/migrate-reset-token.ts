import pool from './db'

async function migrateResetToken() {
  try {
    console.log('Adding reset_token columns to users table...')
    
    // Add reset_token column if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)
    `)
    
    // Add reset_token_expiry column if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `)
    
    console.log('Reset token columns added successfully!')
    
  } catch (error) {
    console.error('Error adding reset token columns:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  migrateResetToken()
    .then(() => {
      console.log('Migration complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { migrateResetToken } 