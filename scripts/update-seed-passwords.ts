import bcrypt from 'bcryptjs'
import pool from '../lib/db'

async function updateSeedPasswords() {
  try {
    console.log('Updating seed user passwords...')

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash('password123', saltRounds)

    // Update existing seed users with the correct password
    const seedUsers = [
      'admin@coachingapp.com',
      'coach1@example.com',
      'coach2@example.com',
      'coach3@example.com',
      'customer1@example.com',
      'customer2@example.com',
      'customer3@example.com',
      'customer4@example.com',
      'customer5@example.com'
    ]

    for (const email of seedUsers) {
      const result = await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, email]
      )
      
      if (result.rowCount > 0) {
        console.log(`Updated password for ${email}`)
      } else {
        console.log(`User ${email} not found`)
      }
    }

    console.log('Seed user passwords updated successfully!')
    console.log('\nYou can now login with any of these accounts using password: password123')
    console.log('Sample accounts:')
    console.log('- coach1@example.com / password123')
    console.log('- customer1@example.com / password123')
    console.log('- admin@coachingapp.com / password123')

  } catch (error) {
    console.error('Error updating seed passwords:', error)
    throw error
  } finally {
    await pool.end()
  }
}

updateSeedPasswords()
