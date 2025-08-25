import { Pool } from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function clearTestData() {
  const client = await pool.connect()
  
  try {
    console.log('🧹 Starting to clear test data for Coach1...')
    
    // Find Coach1
    const coachResult = await client.query(
      'SELECT id FROM users WHERE email = $1 AND role = $2',
      ['coach1@example.com', 'coach']
    )
    
    if (coachResult.rows.length === 0) {
      console.log('❌ Coach1 not found')
      return
    }
    
    const coachId = coachResult.rows[0].id
    console.log(`🎯 Found Coach1 with ID: ${coachId}`)
    
    // Get all test members (emails ending with @test.com)
    const testMembersResult = await client.query(
      'SELECT id FROM users WHERE email LIKE $1',
      ['%@test.com']
    )
    
    const testMemberIds = testMembersResult.rows.map(row => row.id)
    console.log(`👥 Found ${testMemberIds.length} test members to clear`)
    
    if (testMemberIds.length > 0) {
      // Delete in reverse order to respect foreign key constraints
      
      // Delete task progress
      await client.query(
        'DELETE FROM task_progress WHERE user_id = ANY($1)',
        [testMemberIds]
      )
      console.log('🗑️  Deleted task progress')
      
      // Delete milestone progress
      await client.query(
        'DELETE FROM milestone_progress WHERE user_id = ANY($1)',
        [testMemberIds]
      )
      console.log('🗑️  Deleted milestone progress')
      
      // Delete user programs
      await client.query(
        'DELETE FROM user_programs WHERE user_id = ANY($1)',
        [testMemberIds]
      )
      console.log('🗑️  Deleted user programs')
      
      // Delete coach customers relationships
      await client.query(
        'DELETE FROM coach_customers WHERE customer_id = ANY($1)',
        [testMemberIds]
      )
      console.log('🗑️  Deleted coach-customer relationships')
      
      // Delete payments
      await client.query(
        'DELETE FROM payments WHERE user_id = ANY($1)',
        [testMemberIds]
      )
      console.log('🗑️  Deleted payments')
      
      // Delete users
      await client.query(
        'DELETE FROM users WHERE id = ANY($1)',
        [testMemberIds]
      )
      console.log('🗑️  Deleted test users')
    }
    
    // Delete programs created for Coach1
    const programsResult = await client.query(
      'SELECT id FROM coaching_programs WHERE coach_id = $1',
      [coachId]
    )
    
    const programIds = programsResult.rows.map(row => row.id)
    console.log(`📚 Found ${programIds.length} programs to clear`)
    
    if (programIds.length > 0) {
      // Delete tasks (tasks belong to milestones, not directly to programs)
      // First get all milestone IDs for these programs
      const milestonesResult = await client.query(
        'SELECT id FROM milestones WHERE program_id = ANY($1)',
        [programIds]
      )
      
      const milestoneIds = milestonesResult.rows.map(row => row.id)
      
      if (milestoneIds.length > 0) {
        // Delete tasks for these milestones
        await client.query(
          'DELETE FROM tasks WHERE milestone_id = ANY($1)',
          [milestoneIds]
        )
        console.log('🗑️  Deleted tasks')
      }
      
      // Delete milestones
      await client.query(
        'DELETE FROM milestones WHERE program_id = ANY($1)',
        [programIds]
      )
      console.log('🗑️  Deleted milestones')
      
      // Delete programs
      await client.query(
        'DELETE FROM coaching_programs WHERE id = ANY($1)',
        [programIds]
      )
      console.log('🗑️  Deleted programs')
    }
    
    console.log('✅ Test data cleared successfully!')
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

clearTestData().catch(console.error)
