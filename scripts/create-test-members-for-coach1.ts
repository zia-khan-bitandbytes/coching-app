import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Database configuration matching the project
const pool = new Pool({
  user: process.env.DB_USER || 'bitandbytes',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'coaching_app',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
});

interface TestMember {
  name: string;
  email: string;
  password: string;
}

interface TestProgram {
  name: string;
  description: string;
  price: number;
  duration_days: number;
}

interface TestMilestone {
  title: string;
  description: string;
  order_index: number;
  goal_days: number;
}

interface TestTask {
  title: string;
  description: string;
  order_index: number;
  requires_upload: boolean;
}

async function createTestMembersForCoach1() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting to create test members for Coach1...\n');
    
    // First, find Coach1
    const coachResult = await client.query(`
      SELECT c.id as coach_id, c.user_id, c.business_name, u.name, u.email
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      WHERE u.email = 'coach1@example.com' OR u.name LIKE '%Coach1%' OR u.name LIKE '%Coach John%'
      LIMIT 1
    `);
    
    if (coachResult.rows.length === 0) {
      console.log('❌ Coach1 not found. Creating Coach1 first...');
      
      // Create Coach1 user
      const coachUserResult = await client.query(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        'Coach1',
        'coach1@example.com',
        await bcrypt.hash('password123', 10),
        'coach'
      ]);
      
      const coachUserId = coachUserResult.rows[0].id;
      
      // Create Coach1 in coaches table
      await client.query(`
        INSERT INTO coaches (user_id, business_name, bio, specialization, hourly_rate)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        coachUserId,
        'Coach1 Business',
        'Professional coaching services',
        'Life Coaching',
        50.00
      ]);
      
      console.log('✅ Coach1 created successfully');
    }
    
    // Get Coach1 ID
    const coachResult2 = await client.query(`
      SELECT c.id as coach_id, c.user_id, c.business_name, u.name, u.email
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      WHERE u.email = 'coach1@example.com' OR u.name LIKE '%Coach1%' OR u.name LIKE '%Coach John%'
      LIMIT 1
    `);
    
    const coachId = coachResult2.rows[0].coach_id;
    console.log(`🎯 Found Coach1 with ID: ${coachId}\n`);
    
    // Create test programs for Coach1
    const testPrograms: TestProgram[] = [
      {
        name: 'Beginner Life Coaching',
        description: 'A comprehensive program for beginners to improve their life skills and achieve personal goals.',
        price: 99.99,
        duration_days: 30
      },
      {
        name: 'Advanced Career Development',
        description: 'Advanced program focused on career growth, leadership skills, and professional advancement.',
        price: 199.99,
        duration_days: 60
      },
      {
        name: 'Wellness & Mindfulness',
        description: 'Program focused on mental health, stress management, and overall well-being.',
        price: 149.99,
        duration_days: 45
      }
    ];
    
    const programIds: number[] = [];
    
    for (const program of testPrograms) {
      const programResult = await client.query(`
        INSERT INTO coaching_programs (coach_id, title, name, description, price, duration_days, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        coachId,
        program.name,
        program.name,
        program.description,
        program.price,
        program.duration_days,
        true
      ]);
      
      programIds.push(programResult.rows[0].id);
      console.log(`📚 Created program: ${program.name} (ID: ${programResult.rows[0].id})`);
    }
    
    // Create milestones for each program
    const milestoneIds: number[] = [];
    
    for (let i = 0; i < programIds.length; i++) {
      const programId = programIds[i];
      const program = testPrograms[i];
      
      const milestones: TestMilestone[] = [
        {
          title: 'Foundation & Assessment',
          description: 'Understanding your current situation and setting clear goals.',
          order_index: 1,
          goal_days: 7
        },
        {
          title: 'Skill Development',
          description: 'Learning and practicing new skills and techniques.',
          order_index: 2,
          goal_days: 14
        },
        {
          title: 'Implementation & Practice',
          description: 'Applying what you learned in real-life situations.',
          order_index: 3,
          goal_days: 14
        },
        {
          title: 'Review & Optimization',
          description: 'Evaluating progress and making necessary adjustments.',
          order_index: 4,
          goal_days: 7
        }
      ];
      
      for (const milestone of milestones) {
        const milestoneResult = await client.query(`
          INSERT INTO milestones (program_id, title, description, order_index, goal_days)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          programId,
          milestone.title,
          milestone.description,
          milestone.order_index,
          milestone.goal_days
        ]);
        
        milestoneIds.push(milestoneResult.rows[0].id);
        console.log(`🎯 Created milestone: ${milestone.title} for ${program.name}`);
      }
    }
    
    // Create tasks for each milestone
    const taskIds: number[] = [];
    
    for (const milestoneId of milestoneIds) {
      const tasks: TestTask[] = [
        {
          title: 'Self-Assessment',
          description: 'Complete a comprehensive self-assessment to understand your current state.',
          order_index: 1,
          requires_upload: false
        },
        {
          title: 'Goal Setting',
          description: 'Define 3-5 specific, measurable goals for this program.',
          order_index: 2,
          requires_upload: true
        },
        {
          title: 'Action Planning',
          description: 'Create a detailed action plan with timelines and milestones.',
          order_index: 3,
          requires_upload: true
        },
        {
          title: 'Progress Tracking',
          description: 'Set up a system to track your progress and achievements.',
          order_index: 4,
          requires_upload: false
        }
      ];
      
      for (const task of tasks) {
        const taskResult = await client.query(`
          INSERT INTO tasks (milestone_id, title, description, order_index, requires_upload)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          milestoneId,
          task.title,
          task.description,
          task.order_index,
          task.requires_upload
        ]);
        
        taskIds.push(taskResult.rows[0].id);
        console.log(`✅ Created task: ${task.title}`);
      }
    }
    
    // Create test members (customers)
    const testMembers: TestMember[] = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@test.com',
        password: 'password123'
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@test.com',
        password: 'password123'
      },
      {
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@test.com',
        password: 'password123'
      },
      {
        name: 'David Thompson',
        email: 'david.thompson@test.com',
        password: 'password123'
      },
      {
        name: 'Lisa Wang',
        email: 'lisa.wang@test.com',
        password: 'password123'
      }
    ];
    
    const memberIds: number[] = [];
    
    for (const member of testMembers) {
      const memberResult = await client.query(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        member.name,
        member.email,
        await bcrypt.hash(member.password, 10),
        'customer'
      ]);
      
      memberIds.push(memberResult.rows[0].id);
      console.log(`👤 Created member: ${member.name} (ID: ${memberResult.rows[0].id})`);
    }
    
    // Enroll members in programs
    for (let i = 0; i < memberIds.length; i++) {
      const memberId = memberIds[i];
      const programId = programIds[i % programIds.length]; // Distribute members across programs
      
      // Enroll in program
      await client.query(`
        INSERT INTO user_programs (user_id, program_id, status)
        VALUES ($1, $2, $3)
      `, [memberId, programId, 'active']);
      
      // Link to coach
      await client.query(`
        INSERT INTO coach_customers (coach_id, customer_id, status)
        VALUES ($1, $2, $3)
      `, [coachId, memberId, 'active']);
      
      console.log(`🎓 Enrolled member ${memberIds.indexOf(memberId) + 1} in program ${programIds.indexOf(programId) + 1}`);
      
      // Create sequential milestone progress (milestones must be completed in order)
      const milestonesForProgram = milestoneIds.filter((_, index) => 
        Math.floor(index / 4) === programIds.indexOf(programId)
      );
      
      // Sort milestones by their order_index to ensure sequential progression
      const sortedMilestones = milestonesForProgram.sort((a, b) => {
        const aIndex = milestoneIds.indexOf(a);
        const bIndex = milestoneIds.indexOf(b);
        return Math.floor(aIndex / 4) - Math.floor(bIndex / 4);
      });
      
      // Randomly decide how many milestones this member will complete (1 to 4)
      const milestonesToComplete = Math.floor(Math.random() * 4) + 1;
      
      for (let i = 0; i < sortedMilestones.length; i++) {
        const milestoneId = sortedMilestones[i];
        const shouldComplete = i < milestonesToComplete; // Only complete milestones in sequential order
        
        if (shouldComplete) {
          // Calculate realistic completion date based on milestone order
          const baseDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Start 30 days ago
          const daysOffset = i * 7 + Math.floor(Math.random() * 3); // Each milestone takes ~7 days with some variance
          const completionDate = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
          
          await client.query(`
            INSERT INTO milestone_progress (user_id, milestone_id, completed, completed_at)
            VALUES ($1, $2, $3, $4)
          `, [
            memberId,
            milestoneId,
            true,
            completionDate
          ]);
          
          // Complete some tasks for completed milestones
          const tasksForMilestone = taskIds.filter((_, index) => 
            Math.floor(index / 4) === milestoneIds.indexOf(milestoneId)
          );
          
          for (const taskId of tasksForMilestone) {
            const taskCompleted = Math.random() > 0.3; // 70% chance of task completion
            
            if (taskCompleted) {
              const taskCompletionDate = new Date(completionDate.getTime() + Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000);
              
              await client.query(`
                INSERT INTO task_progress (user_id, task_id, completed, completed_at)
                VALUES ($1, $2, $3, $4)
              `, [
                memberId,
                taskId,
                true,
                taskCompletionDate
              ]);
            }
          }
          
          console.log(`    ✅ Completed milestone ${i + 1} for ${testMembers[i].name}`);
        } else {
          console.log(`    ⏳ Milestone ${i + 1} not yet unlocked for ${testMembers[i].name} (requires previous milestone completion)`);
        }
      }
    }
    
    // Create some payments
    for (let i = 0; i < memberIds.length; i++) {
      const memberId = memberIds[i];
      const programId = programIds[i % programIds.length];
      const program = testPrograms[i % testPrograms.length];
      
      await client.query(`
        INSERT INTO payments (user_id, program_id, amount, status, payment_date)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        memberId,
        programId,
        program.price,
        'completed',
        new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      ]);
      
      console.log(`💳 Created payment for ${testMembers[i].name}: $${program.price}`);
    }
    
    console.log('\n🎉 Test data creation completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Created ${testPrograms.length} programs`);
    console.log(`   - Created ${milestoneIds.length} milestones`);
    console.log(`   - Created ${taskIds.length} tasks`);
    console.log(`   - Created ${testMembers.length} test members`);
    console.log(`   - Enrolled all members in programs`);
    console.log(`   - Created sample progress and payments`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createTestMembersForCoach1()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
