import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function checkMilestoneProgressData() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking Milestone Progress Data...\n')
    
    // Check the raw milestone progress data
    const result = await client.query(`
      SELECT 
        u.name as user_name,
        u.email as user_email,
        cp.name as program_name,
        m.title as milestone_title,
        m.goal_days,
        up.enrolled_at,
        mp.completed_at,
        EXTRACT(EPOCH FROM (mp.completed_at - up.enrolled_at)) / 86400 as completion_days
      FROM milestone_progress mp
      JOIN users u ON mp.user_id = u.id
      JOIN milestones m ON mp.milestone_id = m.id
      JOIN coaching_programs cp ON m.program_id = cp.id
      JOIN user_programs up ON u.id = up.user_id AND cp.id = up.program_id
      WHERE mp.completed = true
      ORDER BY completion_days ASC
      LIMIT 15
    `)
    
    console.log('📊 Milestone Progress Analysis:')
    console.log('================================')
    
    if (result.rows.length === 0) {
      console.log('❌ No milestone progress data found!')
      return
    }
    
    let impossibleCount = 0
    result.rows.forEach((row, index) => {
      const completionDays = parseFloat(row.completion_days)
      const isImpossible = completionDays <= 0
      
      if (isImpossible) {
        impossibleCount++
      }
      
      console.log(`${index + 1}. ${row.user_name} - ${row.milestone_title}`)
      console.log(`   📚 Program: ${row.program_name}`)
      console.log(`   🎯 Goal: ${row.goal_days} days`)
      console.log(`   📅 Enrolled: ${row.enrolled_at}`)
      console.log(`   ✅ Completed: ${row.completed_at}`)
      console.log(`   ⏱️  Completion Time: ${completionDays.toFixed(2)} days`)
      
      if (isImpossible) {
        console.log(`   🚨 PROBLEM: Impossible completion time!`)
        console.log(`      This will cause TTV calculation issues!`)
      }
      
      console.log('---')
    })
    
    if (impossibleCount > 0) {
      console.log(`\n🚨 CRITICAL ISSUE: ${impossibleCount} milestones have impossible completion times!`)
      console.log('\n💡 Root Cause:')
      console.log('The test data creation script is setting completion dates that are:')
      console.log('• Before enrollment dates')
      console.log('• Immediately after enrollment (0 or negative days)')
      console.log('• Unrealistic for the milestone goals')
      
      console.log('\n🔧 Solution:')
      console.log('1. Fix the test data creation script to use realistic completion dates')
      console.log('2. Ensure completion_at > enrolled_at for all milestones')
      console.log('3. Set completion times that make sense relative to goal_days')
    } else {
      console.log('\n✅ All milestone completion times look realistic!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

checkMilestoneProgressData().catch(console.error)

