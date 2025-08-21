import pool from '../lib/db'

async function checkDatabaseStructure() {
  try {
    console.log('Checking database structure...')
    
    // Check users table structure
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    console.log('\nUsers table columns:')
    usersColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })
    
    // Check if there are any users
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users')
    console.log(`\nTotal users in database: ${userCount.rows[0].count}`)
    
    if (parseInt(userCount.rows[0].count) > 0) {
      const sampleUser = await pool.query('SELECT * FROM users LIMIT 1')
      console.log('\nSample user data:')
      console.log(sampleUser.rows[0])
    }
    
    // Check table constraints
    const constraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass
    `)
    
    console.log('\nTable constraints:')
    constraints.rows.forEach(row => {
      console.log(`- ${row.conname}: ${row.contype} - ${row.definition}`)
    })
    
  } catch (error) {
    console.error('Error checking database structure:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  checkDatabaseStructure()
    .then(() => {
      console.log('\nDatabase structure check completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database structure check failed:', error)
      process.exit(1)
    })
}

export { checkDatabaseStructure }
