import pool from '../lib/db'
import bcrypt from 'bcryptjs'

async function createSimpleTestUser() {
  try {
    console.log('Creating simple test user...')
    
    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash('test123', saltRounds)
    
    // Check if test user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['test@example.com']
    )
    
    if (existingUser.rows.length > 0) {
      console.log('Test user already exists, updating password...')
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hashedPassword, 'test@example.com']
      )
      console.log('Test user password updated successfully')
    } else {
      // Create new test user
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        ['Test User', 'test@example.com', hashedPassword, 'coach']
      )
      console.log('Test user created successfully:', result.rows[0].email)
    }
    
    // Create coach record if it doesn't exist
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['test@example.com']
    )
    
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id
      const existingCoach = await pool.query(
        'SELECT id FROM coaches WHERE user_id = $1',
        [userId]
      )
      
      if (existingCoach.rows.length === 0) {
        await pool.query(
          'INSERT INTO coaches (user_id, business_name) VALUES ($1, $2)',
          [userId, 'Test Coaching Business']
        )
        console.log('Coach record created successfully')
      } else {
        console.log('Coach record already exists')
      }
    }
    
    console.log('\nTest user credentials:')
    console.log('Email: test@example.com')
    console.log('Password: test123')
    console.log('Role: coach')
    
  } catch (error) {
    console.error('Error creating test user:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createSimpleTestUser()
    .then(() => {
      console.log('\nTest user creation completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Test user creation failed:', error)
      process.exit(1)
    })
}

export { createSimpleTestUser }
