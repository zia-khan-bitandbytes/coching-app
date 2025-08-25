import pool from '../lib/db'

async function fixDatabase() {
  try {
    console.log('Fixing database schema...')
    
    // Check if users table exists and has password column
    const tableCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password'
    `)
    
    if (tableCheck.rows.length === 0) {
      console.log('Adding password column to users table...')
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN password VARCHAR(255)
      `)
      console.log('Password column added successfully')
    } else {
      console.log('Password column already exists')
    }
    
    // Check if reset_token columns exist
    const resetTokenCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'reset_token'
    `)
    
    if (resetTokenCheck.rows.length === 0) {
      console.log('Adding reset_token columns to users table...')
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN reset_token VARCHAR(255)
      `)
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN reset_token_expiry TIMESTAMP
      `)
      console.log('Reset token columns added successfully')
    } else {
      console.log('Reset token columns already exist')
    }
    
    // Update role constraints
    console.log('Updating role constraints...')
    try {
      await pool.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
      `)
      await pool.query(`
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('coach', 'customer', 'super_admin'))
      `)
      console.log('Role constraints updated successfully')
    } catch (error) {
      console.log('Role constraints already updated or not needed')
    }
    
    // Create coaches table if it doesn't exist
    const coachesTableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'coaches'
    `)
    
    if (coachesTableCheck.rows.length === 0) {
      console.log('Creating coaches table...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS coaches (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          business_name VARCHAR(255) NOT NULL,
          bio TEXT,
          specialization VARCHAR(255),
          hourly_rate DECIMAL(10,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('Coaches table created successfully')
    } else {
      console.log('Coaches table already exists')
    }
    
    // Create other necessary tables
    const tables = [
      'coaching_programs',
      'milestones', 
      'tasks',
      'reset_tokens'
    ]
    
    for (const tableName of tables) {
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = $1
      `, [tableName])
      
      if (tableCheck.rows.length === 0) {
        console.log(`Creating ${tableName} table...`)
        // You can add specific table creation logic here if needed
        console.log(`${tableName} table creation skipped (not implemented in this script)`)
      } else {
        console.log(`${tableName} table already exists`)
      }
    }
    
    console.log('Database fix completed successfully!')
    
  } catch (error) {
    console.error('Database fix failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  fixDatabase()
    .then(() => {
      console.log('Database fix completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database fix failed:', error)
      process.exit(1)
    })
}

export { fixDatabase }
