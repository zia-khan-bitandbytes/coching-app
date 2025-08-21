const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function checkAllTables() {
  try {
    console.log('🔍 Checking all tables in database...')
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('\n📋 All tables found:')
    tables.rows.forEach(table => {
      console.log(`   ✅ ${table.table_name}`)
    })
    
    // Check if payments table exists
    const hasPayments = tables.rows.some(t => t.table_name === 'payments')
    console.log(`\n❓ Has payments table: ${hasPayments}`)
    
    // Check if any tables are empty
    console.log('\n📊 Checking table contents:')
    for (const table of tables.rows) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`)
      console.log(`   ${table.table_name}: ${count.rows[0].count} rows`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkAllTables()
