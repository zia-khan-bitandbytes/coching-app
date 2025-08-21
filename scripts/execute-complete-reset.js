const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function executeCompleteReset() {
  try {
    console.log('🗑️  Executing complete database reset...')
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'complete-database-reset.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      if (statement.trim() === ';') continue
      
      try {
        console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`)
        await pool.query(statement)
        console.log(`✅ Statement ${i + 1} executed successfully`)
      } catch (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message)
        // Continue with other statements
      }
    }
    
    console.log('\n🎉 Complete database reset finished!')
    console.log('\n📊 New test data created:')
    console.log('  👨‍🏫 Coach: coach1@example.com (password: password123)')
    console.log('  👩‍💼 Customer Jessica: customer1@example.com (password: password123)')
    console.log('  👨‍💼 Customer Alex: customer2@example.com (password: password123)')
    console.log('\n🔒 Sequential milestone logic:')
    console.log('  • Milestone 1: Started but not completed (can be completed)')
    console.log('  • Milestone 2: NOT started (locked until Milestone 1 completes)')
    console.log('  • Milestone 3: NOT started (locked until Milestone 2 completes)')
    console.log('  • Milestone 4: NOT started (locked until Milestone 3 completes)')
    
    // Verify the new structure
    console.log('\n🔍 Verifying new database structure...')
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users')
    const milestoneCount = await pool.query('SELECT COUNT(*) FROM milestones')
    const taskCount = await pool.query('SELECT COUNT(*) FROM tasks')
    
    console.log(`  Users: ${userCount.rows[0].count}`)
    console.log(`  Milestones: ${milestoneCount.rows[0].count}`)
    console.log(`  Tasks: ${taskCount.rows[0].count}`)
    
    // Check milestone progress for Jessica
    const jessicaProgress = await pool.query(`
      SELECT 
        m.title,
        mp.started_at,
        mp.completed,
        mp.completed_at
      FROM milestone_progress mp
      JOIN milestones m ON mp.milestone_id = m.id
      WHERE mp.user_id = 2
      ORDER BY m.order_index
    `)
    
    console.log('\n📋 Jessica\'s milestone progress:')
    jessicaProgress.rows.forEach(row => {
      const status = row.completed ? '✅ Completed' : 
                   row.started_at ? '🟡 In Progress' : '🟠 Ready to Start'
      console.log(`  ${row.title}: ${status}`)
    })
    
  } catch (error) {
    console.error('❌ Error during complete reset:', error)
  } finally {
    await pool.end()
  }
}

executeCompleteReset()
