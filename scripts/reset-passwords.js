const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function resetPasswords() {
  try {
    console.log('🔐 Resetting passwords to simple values for testing...')
    
    // Simple password for all users
    const simplePassword = 'password123'
    const hashedPassword = await bcrypt.hash(simplePassword, 10)
    
    // Update all users with the simple password
    await pool.query(`
      UPDATE users 
      SET password = $1
      WHERE role IN ('coach', 'customer', 'super_admin')
    `, [hashedPassword])
    
    console.log('✅ All passwords reset successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('   🔑 Password for ALL users: password123')
    console.log('\n👥 Available Users:')
    
    const users = await pool.query(`
      SELECT email, name, role
      FROM users
      WHERE role IN ('coach', 'customer', 'super_admin')
      ORDER BY role, name
    `)
    
    users.rows.forEach(user => {
      console.log(`   📧 ${user.email} (${user.name} - ${user.role})`)
    })
    
    console.log('\n🚀 You can now login with any email + password123')
    
  } catch (error) {
    console.error('❌ Error resetting passwords:', error)
  } finally {
    await pool.end()
  }
}

resetPasswords()
