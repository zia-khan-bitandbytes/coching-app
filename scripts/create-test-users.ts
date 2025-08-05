import bcrypt from 'bcryptjs'
import pool from '../lib/db'

async function createTestUsers() {
  try {
    console.log('Creating test users...')

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash('password123', saltRounds)

    // Create test users
    const testUsers = [
      {
        name: 'Test Customer',
        email: 'customer@test.com',
        password: hashedPassword,
        role: 'customer'
      },
      {
        name: 'Test Coach',
        email: 'coach@test.com',
        password: hashedPassword,
        role: 'coach'
      },
      {
        name: 'Test Super Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'super_admin'
      }
    ]

    for (const user of testUsers) {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      )

      if (existingUser.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
          [user.name, user.email, user.password, user.role]
        )
        console.log(`Created ${user.role} user: ${user.email}`)
      } else {
        console.log(`User ${user.email} already exists, skipping...`)
      }
    }

    console.log('Test users created successfully!')
  } catch (error) {
    console.error('Error creating test users:', error)
    throw error
  } finally {
    await pool.end()
  }
}

createTestUsers() 