import pool from './db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function initializeDatabase() {
  try {
    console.log('Initializing database...')
    
    // Read the schema file
    const schemaPath = join(process.cwd(), 'lib', 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    
    // Execute the schema
    await pool.query(schema)
    
    console.log('Database initialized successfully!')
    
    // Test the connection by querying users table
    const result = await pool.query('SELECT COUNT(*) FROM users')
    console.log(`Users table ready. Current user count: ${result.rows[0].count}`)
    
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database setup complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database setup failed:', error)
      process.exit(1)
    })
}

export { initializeDatabase } 