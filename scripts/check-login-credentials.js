const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function checkCredentials() {
  try {
    console.log('🔍 Checking login credentials...')
    
    const users = await pool.query(`
      SELECT 
        id,
        email,
        name,
        role,
        password
      FROM users
      ORDER BY role, id
    `)
    
    console.log('\n📊 Available Users for Login:')
    users.rows.forEach(user => {
      console.log(`\n👤 ${user.name} (${user.role})`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🔑 Password: ${user.password}`)
      console.log(`   🆔 User ID: ${user.id}`)
    })
    
    console.log('\n💡 Login Instructions:')
    console.log('   • Use any of the email addresses above')
    console.log('   • The password is the hashed value shown above')
    console.log('   • For testing, you might need to reset passwords to simple values')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkCredentials()
