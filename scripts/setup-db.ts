import pool from '../lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function setupDatabase() {
  try {
    console.log('Setting up database...')
    
    // Initialize database with new schema
    console.log('Initializing database...')
    const schemaPath = join(process.cwd(), 'lib', 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    await pool.query(schema)
    console.log('Database initialized successfully')
    
    // Update the role constraint to allow new roles
    console.log('Updating role constraints...')
    try {
      await pool.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('coach', 'customer', 'super_admin'));
      `)
      console.log('Role constraints updated successfully')
    } catch (error) {
      console.log('Role constraints already updated or not needed')
    }
    
    // Run role migration
    console.log('Starting role migration...')
    
    // Update existing users with 'user' role to 'customer'
    const updateUserResult = await pool.query(
      "UPDATE users SET role = 'customer' WHERE role = 'user'"
    )
    console.log(`Updated ${updateUserResult.rowCount} users from 'user' to 'customer'`)

    // Update existing users with 'admin' role to 'super_admin'
    const updateAdminResult = await pool.query(
      "UPDATE users SET role = 'super_admin' WHERE role = 'admin'"
    )
    console.log(`Updated ${updateAdminResult.rowCount} admins from 'admin' to 'super_admin'`)

    // Verify the migration
    const verifyResult = await pool.query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    )
    
    console.log('Role distribution after migration:')
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.role}: ${row.count} users`)
    })

    console.log('Role migration completed')
    console.log('Database setup completed successfully!')
  } catch (error) {
    console.error('Database setup failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Setup completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Setup failed:', error)
      process.exit(1)
    })
}

export { setupDatabase } 