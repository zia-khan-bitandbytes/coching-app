const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function checkCustomers() {
  try {
    console.log('🔍 Checking customers in database...')
    
    const customers = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        cc.coach_id
      FROM users u
      LEFT JOIN coach_customers cc ON u.id = cc.customer_id
      WHERE u.role = 'customer'
      ORDER BY u.id
    `)
    
    console.log('\n📊 Customers found:')
    customers.rows.forEach(customer => {
      console.log(`  ID: ${customer.id}, Name: ${customer.name}, Email: ${customer.email}, Coach ID: ${customer.coach_id}`)
    })
    
    // Also check coach
    const coach = await pool.query(`
      SELECT 
        c.id,
        c.business_name,
        u.name,
        u.email
      FROM coaches c
      JOIN users u ON c.user_id = u.id
    `)
    
    console.log('\n👨‍🏫 Coach found:')
    coach.rows.forEach(c => {
      console.log(`  ID: ${c.id}, Name: ${c.name}, Business: ${c.business_name}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkCustomers()
