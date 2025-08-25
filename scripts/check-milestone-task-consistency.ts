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

async function checkMilestoneTaskConsistency() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking milestone vs task completion consistency...\n')
    
    // Check milestone progress vs task progress
    const result = await client.query(`
      SELECT 
        mp.user_id,
        u.name as user_name,
        mp.milestone_id,
        m.title as milestone_title,
        mp.completed as milestone_completed,
        mp.completed_at as milestone_completed_at,
        COUNT(tp.id) as completed_tasks,
        COUNT(t.id) as total_tasks
      FROM milestone_progress mp 
      JOIN milestones m ON mp.milestone_id = m.id
      JOIN users u ON mp.user_id = u.id
      JOIN tasks t ON m.id = t.milestone_id
      LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.user_id = mp.user_id AND tp.completed = true
      WHERE mp.completed = true
      GROUP BY mp.user_id, mp.milestone_id, mp.completed, mp.completed_at, u.name, m.title
      ORDER BY mp.user_id, mp.milestone_id
      LIMIT 20
    `)
    
    console.log('📊 Milestone vs Task Completion Check:')
    console.log('=' * 60)
    
    let inconsistencies = 0
    for (const row of result.rows) {
      const isConsistent = row.completed_tasks === row.total_tasks
      const status = isConsistent ? '✅' : '❌ INCONSISTENT'
      
      if (!isConsistent) {
        inconsistencies++
      }
      
      console.log(`${status} User: ${row.user_name} (ID: ${row.user_id})`)
      console.log(`   Milestone: ${row.milestone_title} (ID: ${row.milestone_id})`)
      console.log(`   Milestone completed: ${row.milestone_completed} at ${row.milestone_completed_at}`)
      console.log(`   Tasks: ${row.completed_tasks}/${row.total_tasks} completed`)
      console.log('')
    }
    
    console.log(`\n📈 Summary:`)
    console.log(`Total completed milestones checked: ${result.rows.length}`)
    console.log(`Inconsistencies found: ${inconsistencies}`)
    
    if (inconsistencies > 0) {
      console.log('\n🚨 PROBLEM DETECTED: Some milestones are marked complete but tasks are not!')
      console.log('This violates the business logic that milestones should only be complete when all tasks are done.')
    } else {
      console.log('\n✅ All milestone-task relationships are consistent!')
    }
    
  } catch (error) {
    console.error('❌ Error checking consistency:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

checkMilestoneTaskConsistency().catch(console.error)

