const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'bitandbytes',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'coaching_app',
  password: process.env.DB_PASSWORD || '1234',
  port: process.env.DB_PORT || 5432,
})

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'reset-and-populate-sequential-milestones.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📖 SQL file loaded successfully')
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`📝 Executing statement ${i + 1}/${statements.length}...`)
          await pool.query(statement)
          console.log(`✅ Statement ${i + 1} executed successfully`)
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message)
          // Continue with other statements
        }
      }
    }
    
    console.log('🎉 Database reset completed successfully!')
    
    // Verify the data was created
    console.log('\n🔍 Verifying created data...')
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users')
    const coachCount = await pool.query('SELECT COUNT(*) FROM coaches')
    const programCount = await pool.query('SELECT COUNT(*) FROM coaching_programs')
    const milestoneCount = await pool.query('SELECT COUNT(*) FROM milestones')
    const customerCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = \'customer\'')
    
    console.log(`👥 Users: ${userCount.rows[0].count}`)
    console.log(`👨‍🏫 Coaches: ${coachCount.rows[0].count}`)
    console.log(`📚 Programs: ${programCount.rows[0].count}`)
    console.log(`🎯 Milestones: ${milestoneCount.rows[0].count}`)
    console.log(`👤 Customers: ${customerCount.rows[0].count}`)
    
    // Show milestone progress for Jessica Lee
    console.log('\n📊 Jessica Lee\'s milestone progress:')
    const jessicaProgress = await pool.query(`
      SELECT 
        m.title,
        mp.started_at,
        mp.completed_at,
        mp.completed,
        CASE 
          WHEN mp.completed = true THEN 
            EXTRACT(EPOCH FROM (mp.completed_at - mp.started_at)) / 86400
          ELSE NULL
        END as days_taken
      FROM milestone_progress mp
      JOIN milestones m ON mp.milestone_id = m.id
      JOIN users u ON mp.user_id = u.id
      WHERE u.email = 'customer1@example.com'
      ORDER BY m.order_index
    `)
    
    jessicaProgress.rows.forEach((row, index) => {
      const status = row.completed ? '✅ Completed' : '⏳ In Progress'
      const days = row.days_taken ? `(${Math.round(row.days_taken)} days)` : ''
      console.log(`  ${index + 1}. ${row.title}: ${status} ${days}`)
      console.log(`     Started: ${row.started_at}`)
      if (row.completed_at) {
        console.log(`     Completed: ${row.completed_at}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the reset
resetDatabase()
