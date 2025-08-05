import pool from './db'

async function migrateRoles() {
  try {
    console.log('Migrating roles from client to coach...')

    // First, update any existing users with 'client' role to 'coach'
    await pool.query(`
      UPDATE users 
      SET role = 'coach' 
      WHERE role = 'client'
    `)
    console.log('Updated existing client users to coach role')

    // Drop the old constraint
    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
    `)
    console.log('Dropped old role constraint')

    // Add the new constraint with 'coach' instead of 'client'
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('coach', 'customer', 'super_admin'))
    `)
    console.log('Added new role constraint with coach role')

    // Verify the migration
    const result = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `)
    
    console.log('\nCurrent user roles in database:')
    result.rows.forEach(row => {
      console.log(`- ${row.role}: ${row.count} users`)
    })

    console.log('\nRole migration completed successfully!')
  } catch (error) {
    console.error('Error migrating roles:', error)
    throw error
  } finally {
    await pool.end()
  }
}

migrateRoles() 