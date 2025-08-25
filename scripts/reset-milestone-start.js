const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function resetMilestoneStart() {
  try {
    console.log('🔧 Resetting milestone start dates to test Start Milestone functionality...')
    
    // Reset started_at for Milestone 2 (Chapter 5: Growth) for user 3
    const result = await pool.query(`
      UPDATE milestone_progress 
      SET started_at = NULL, completed = false, completed_at = NULL
      WHERE milestone_id = 2 AND user_id = 3
    `)
    
    console.log(`✅ Updated ${result.rowCount} milestone progress records`)
    
    // Verify the change
    const verify = await pool.query(`
      SELECT 
        mp.milestone_id,
        mp.started_at,
        mp.completed,
        mp.completed_at,
        m.title
      FROM milestone_progress mp
      JOIN milestones m ON mp.milestone_id = m.id
      WHERE mp.user_id = 3 AND mp.milestone_id = 2
    `)
    
    if (verify.rows.length > 0) {
      const milestone = verify.rows[0]
      console.log(`\n📋 Milestone 2 (${milestone.title}) status:`)
      console.log(`  Started at: ${milestone.started_at || 'NULL (Ready to start!)'}`)
      console.log(`  Completed: ${milestone.completed}`)
      console.log(`  Completed at: ${milestone.completed_at || 'NULL'}`)
    }
    
    console.log('\n🎉 Now refresh your customer roadmap page!')
    console.log('You should see Milestone 2 showing "upcoming" status with a "Start Milestone" button.')
    
  } catch (error) {
    console.error('❌ Error resetting milestone start:', error)
  } finally {
    await pool.end()
  }
}

resetMilestoneStart()
