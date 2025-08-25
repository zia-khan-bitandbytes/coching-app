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

async function checkTTVData() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking TTV Data in Database...\n')
    
    const result = await client.query(`
      SELECT 
        m.title as milestone_title,
        m.goal_days,
        m.avg_completion_days,
        m.completed_count,
        cp.name as program_name
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE m.avg_completion_days IS NOT NULL 
      AND m.completed_count > 0
      ORDER BY m.avg_completion_days ASC
      LIMIT 10
    `)
    
    console.log('📊 TTV Data Analysis:')
    console.log('======================')
    
    if (result.rows.length === 0) {
      console.log('❌ No TTV data found!')
      return
    }
    
    result.rows.forEach((row, index) => {
      const daysDiff = row.goal_days - row.avg_completion_days
      const isImpossible = row.avg_completion_days <= 0
      
      console.log(`${index + 1}. ${row.milestone_title} (${row.program_name}):`)
      console.log(`   🎯 Goal: ${row.goal_days} days`)
      console.log(`   ⏱️  Actual: ${row.avg_completion_days} days`)
      console.log(`   📈 Difference: ${daysDiff} days`)
      console.log(`   👥 Completed: ${row.completed_count} times`)
      
      if (isImpossible) {
        console.log(`   ⚠️  PROBLEM: Impossible completion time!`)
      } else if (daysDiff > row.goal_days) {
        console.log(`   ⚠️  PROBLEM: Unrealistic "ahead of goal" result!`)
      }
      
      console.log('---')
    })
    
    // Check for impossible values
    const impossibleValues = result.rows.filter(row => 
      row.avg_completion_days <= 0 || 
      (row.goal_days - row.avg_completion_days) > row.goal_days
    )
    
    if (impossibleValues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:')
      console.log('================')
      impossibleValues.forEach(row => {
        console.log(`• ${row.milestone_title}: avg_completion_days = ${row.avg_completion_days}`)
        console.log(`  This creates impossible TTV calculations!`)
      })
      
      console.log('\n💡 SOLUTION:')
      console.log('The avg_completion_days values in your test data are unrealistic.')
      console.log('They should be positive numbers representing actual completion times.')
      console.log('For example: if goal is 20 days, avg_completion_days should be 15-25 days.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

checkTTVData().catch(console.error)
