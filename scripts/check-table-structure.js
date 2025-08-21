const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structure...')
    
    // Check coaching_programs table
    const coachingProgramsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'coaching_programs'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 coaching_programs table structure:')
    coachingProgramsColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check milestones table
    const milestonesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'milestones'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 milestones table structure:')
    milestonesColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check sample data
    console.log('\n📊 Sample data from coaching_programs:')
    const samplePrograms = await pool.query('SELECT * FROM coaching_programs LIMIT 1')
    if (samplePrograms.rows.length > 0) {
      console.log('  Sample program:', samplePrograms.rows[0])
    } else {
      console.log('  No programs found')
    }
    
    console.log('\n📊 Sample data from milestones:')
    const sampleMilestones = await pool.query('SELECT * FROM milestones LIMIT 1')
    if (sampleMilestones.rows.length > 0) {
      console.log('  Sample milestone:', sampleMilestones.rows[0])
    } else {
      console.log('  No milestones found')
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error)
  } finally {
    await pool.end()
  }
}

checkTableStructure()
