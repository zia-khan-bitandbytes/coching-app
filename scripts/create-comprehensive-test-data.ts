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

async function createComprehensiveTestData() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Creating comprehensive test data for Coach1...')
    
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
    
    // Create 3 comprehensive programs
    const programs = [
      {
        name: 'Life Transformation Mastery',
        description: 'Complete life transformation program covering all aspects of personal development',
        price: 299.99,
        duration_days: 90
      },
      {
        name: 'Career Acceleration Pro',
        description: 'Advanced career development and leadership skills program',
        price: 399.99,
        duration_days: 120
      },
      {
        name: 'Wellness & Mindfulness Journey',
        description: 'Holistic wellness program focusing on mental and physical health',
        price: 199.99,
        duration_days: 60
      }
    ]
    
    const programIds = []
    for (const program of programs) {
      const result = await client.query(`
        INSERT INTO coaching_programs (coach_id, title, name, description, price, duration_days, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [coachId, program.name, program.name, program.description, program.price, program.duration_days, true])
      
      programIds.push(result.rows[0].id)
      console.log(`📚 Created program: ${program.name} (ID: ${result.rows[0].id})`)
    }
    
    // Create milestones for each program (4 milestones each)
    const milestoneIds = []
    const milestoneNames = [
      'Foundation & Assessment',
      'Skill Development & Learning',
      'Implementation & Practice',
      'Mastery & Optimization'
    ]
    
    for (let programIndex = 0; programIndex < programIds.length; programIndex++) {
      const programId = programIds[programIndex]
      const program = programs[programIndex]
      
      for (let i = 0; i < 4; i++) {
        const goalDays = Math.floor(program.duration_days / 4) + (i === 0 ? 5 : i === 3 ? 10 : 0)
        
        const result = await client.query(`
          INSERT INTO milestones (program_id, title, description, goal_days, order_index)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [programId, milestoneNames[i], `${milestoneNames[i]} for ${program.name}`, goalDays, i + 1])
        
        milestoneIds.push(result.rows[0].id)
        console.log(`🎯 Created milestone: ${milestoneNames[i]} for ${program.name}`)
      }
    }
    
    // Create tasks for each milestone (3-4 tasks each)
    const taskIds = []
    const milestoneTaskMap = new Map() // Map milestone ID to its task IDs
    const taskTemplates = [
      ['Self-Assessment & Goal Setting', 'Complete comprehensive assessment and define clear objectives', true],
      ['Research & Learning', 'Study relevant materials and concepts', false],
      ['Practical Application', 'Apply learned concepts in real scenarios', true],
      ['Progress Review & Adjustment', 'Evaluate progress and make necessary adjustments', false]
    ]
    
    for (const milestoneId of milestoneIds) {
      const numTasks = Math.floor(Math.random() * 2) + 3 // 3-4 tasks
      const milestoneTaskIds = []
      
      for (let i = 0; i < numTasks; i++) {
        const taskTemplate = taskTemplates[i % taskTemplates.length]
        
        const result = await client.query(`
          INSERT INTO tasks (milestone_id, title, description, order_index, requires_upload)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [milestoneId, taskTemplate[0], taskTemplate[1], i + 1, taskTemplate[2]])
        
        const taskId = result.rows[0].id
        taskIds.push(taskId)
        milestoneTaskIds.push(taskId)
        console.log(`✅ Created task: ${taskTemplate[0]} for milestone ${milestoneId}`)
      }
      
      milestoneTaskMap.set(milestoneId, milestoneTaskIds)
    }
    
    // Create 12 diverse test members
    const testMembers = [
      { name: 'Sarah Johnson', email: 'sarah.j@test.com' },
      { name: 'Michael Chen', email: 'michael.c@test.com' },
      { name: 'Emily Rodriguez', email: 'emily.r@test.com' },
      { name: 'David Thompson', email: 'david.t@test.com' },
      { name: 'Lisa Wang', email: 'lisa.w@test.com' },
      { name: 'James Wilson', email: 'james.w@test.com' },
      { name: 'Maria Garcia', email: 'maria.g@test.com' },
      { name: 'Robert Brown', email: 'robert.b@test.com' },
      { name: 'Jennifer Lee', email: 'jennifer.l@test.com' },
      { name: 'Christopher Davis', email: 'chris.d@test.com' },
      { name: 'Amanda Taylor', email: 'amanda.t@test.com' },
      { name: 'Kevin Martinez', email: 'kevin.m@test.com' }
    ]
    
    const memberIds = []
    for (const member of testMembers) {
      const result = await client.query(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [member.name, member.email, '$2a$10$test.hash.for.testing', 'customer'])
      
      memberIds.push(result.rows[0].id)
      console.log(`👤 Created member: ${member.name} (ID: ${result.rows[0].id})`)
    }
    
    // Enroll members in different programs with varied progress
    for (let memberIndex = 0; memberIndex < memberIds.length; memberIndex++) {
      const memberId = memberIds[memberIndex]
      const member = testMembers[memberIndex]
      
      // Each member enrolls in 1-2 programs
      const programsToEnroll = memberIndex < 6 ? 2 : 1
      const enrolledPrograms = []
      
      for (let i = 0; i < programsToEnroll; i++) {
        const programIndex = (memberIndex + i) % programIds.length
        const programId = programIds[programIndex]
        
        await client.query(`
          INSERT INTO user_programs (user_id, program_id, status)
          VALUES ($1, $2, $3)
        `, [memberId, programId, 'active'])
        
        // Link coach and customer (only once per member)
        if (i === 0) {
          await client.query(`
            INSERT INTO coach_customers (coach_id, customer_id, status)
            VALUES ($1, $2, $3)
          `, [coachId, memberId, 'active'])
        }
        
        enrolledPrograms.push(programIndex)
        console.log(`🎓 Enrolled ${member.name} in program ${programIndex + 1}`)
        
        // Create sequential milestone progress
        const milestonesForProgram = milestoneIds.filter((_, index) => 
          Math.floor(index / 4) === programIndex
        )
        
        // Randomly decide how many milestones to complete (1-4)
        const milestonesToComplete = Math.floor(Math.random() * 4) + 1
        
        for (let j = 0; j < milestonesForProgram.length; j++) {
          const milestoneId = milestonesForProgram[j]
          const shouldComplete = j < milestonesToComplete
          
          if (shouldComplete) {
            // Get all tasks for this milestone using the map
            const tasksForMilestone = milestoneTaskMap.get(milestoneId) || []
            
            // Calculate completion date (some overdue, some on time)
            // IMPORTANT: Completion dates must come AFTER enrollment date
            const enrollmentDate = new Date() // Current time (enrollment date)
            const daysOffset = j * 15 + Math.floor(Math.random() * 10) // Each milestone takes ~15 days
            
            // Make some milestones overdue
            const isOverdue = Math.random() > 0.7 // 30% chance of being overdue
            const overdueDays = isOverdue ? Math.floor(Math.random() * 20) + 5 : 0
            
            // Calculate completion date: enrollment + offset + overdue days
            const completionDate = new Date(enrollmentDate.getTime() + (daysOffset + overdueDays) * 24 * 60 * 60 * 1000)
            
            // CRITICAL: Only mark milestone complete if ALL tasks are completed
            // First, complete ALL tasks for this milestone
            for (const taskId of tasksForMilestone) {
              // Task completion should be BEFORE milestone completion
              // Calculate task completion as milestone completion - random days (1-5 days before)
              const daysBeforeMilestone = Math.floor(Math.random() * 5) + 1
              const taskCompletionDate = new Date(completionDate.getTime() - daysBeforeMilestone * 24 * 60 * 60 * 1000)
              
              await client.query(`
                INSERT INTO task_progress (user_id, task_id, completed, completed_at)
                VALUES ($1, $2, $3, $4)
              `, [memberId, taskId, true, taskCompletionDate])
            }
            
            // Now mark milestone as complete (after all tasks are done)
            await client.query(`
              INSERT INTO milestone_progress (user_id, milestone_id, completed, completed_at)
              VALUES ($1, $2, $3, $4)
            `, [memberId, milestoneId, true, completionDate])
            
            const status = isOverdue ? 'OVERDUE' : 'COMPLETED'
            console.log(`    ✅ ${status} milestone ${j + 1} for ${member.name} (${tasksForMilestone.length} tasks completed)`)
          } else {
            console.log(`    🔒 Milestone ${j + 1} locked for ${member.name} (requires previous completion)`)
          }
        }
      }
      
      // Create payments
      for (const programIndex of enrolledPrograms) {
        const program = programs[programIndex]
        await client.query(`
          INSERT INTO payments (user_id, program_id, amount, status)
          VALUES ($1, $2, $3, $4)
        `, [memberId, programIds[programIndex], program.price, 'completed'])
        
        console.log(`💳 Created payment for ${member.name}: $${program.price}`)
      }
    }
    
    console.log('\n🎉 Comprehensive test data creation completed!')
    console.log('📊 Summary:')
    console.log(`   - Created ${programs.length} programs`)
    console.log(`   - Created ${milestoneIds.length} milestones`)
    console.log(`   - Created ${taskIds.length} tasks`)
    console.log(`   - Created ${testMembers.length} test members`)
    console.log('   - Enrolled all members in programs with sequential progress')
    console.log('   - Created realistic progress with some overdue milestones')
    console.log('   - Created payments for all enrollments')
    
  } catch (error) {
    console.error('❌ Error creating test data:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createComprehensiveTestData().catch(console.error)
