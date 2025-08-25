import { Pool } from 'pg'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env.local' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function fixComprehensivePasswords() {
  const client = await pool.connect()
  
  try {
    console.log('🔧 Fixing comprehensive test member passwords...')
    
    // Get all test members (emails ending with @test.com)
    const testMembersResult = await client.query(
      'SELECT id, name, email FROM users WHERE email LIKE $1',
      ['%@test.com']
    )
    
    if (testMembersResult.rows.length === 0) {
      console.log('❌ No test members found')
      return
    }
    
    console.log(`\nFound ${testMembersResult.rows.length} test members to fix:\n`)
    
    // Hash the password once
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Update all test members
    for (const member of testMembersResult.rows) {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, member.id]
      )
      
      console.log(`✅ Fixed password for: ${member.name} (${member.email})`)
    }
    
    // Also fix Coach1 password
    const coachResult = await client.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      ['coach1@example.com']
    )
    
    if (coachResult.rows.length > 0) {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, coachResult.rows[0].id]
      )
      
      console.log(`✅ Fixed password for: ${coachResult.rows[0].name} (${coachResult.rows[0].email})`)
    }
    
    console.log('\n🎉 All comprehensive test member passwords have been fixed!')
    console.log('\n📋 Login Credentials:')
    console.log('All test members and Coach1 now use: password123')
    
    console.log('\nTest Members:')
    for (const member of testMembersResult.rows) {
      console.log(`- ${member.name}: ${member.email} / password123`)
    }
    
    if (coachResult.rows.length > 0) {
      console.log(`- ${coachResult.rows[0].name}: ${coachResult.rows[0].email} / password123`)
    }
    
    console.log('\n✅ Script completed successfully')
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

fixComprehensivePasswords().catch(console.error)

