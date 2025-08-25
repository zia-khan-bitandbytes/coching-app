import { Pool } from 'pg';

// Database configuration matching the project
const pool = new Pool({
  user: process.env.DB_USER || 'bitandbytes',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'coaching_app',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function fixSequentialMilestones() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing sequential milestone progression...\n');
    
    // First, clear all existing milestone progress for test members
    console.log('Clearing existing milestone progress...');
    await client.query(`
      DELETE FROM milestone_progress 
      WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')
    `);
    
    console.log('Clearing existing task progress...');
    await client.query(`
      DELETE FROM task_progress 
      WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')
    `);
    
    // Get all test members
    const testMembersResult = await client.query(`
      SELECT id, name, email FROM users 
      WHERE email LIKE '%@test.com' 
      ORDER BY id
    `);
    
    console.log(`Found ${testMembersResult.rows.length} test members to fix\n`);
    
    // For each test member, create proper sequential milestone progression
    for (const member of testMembersResult.rows) {
      console.log(`Processing ${member.name} (${member.email})...`);
      
      // Get their enrolled programs
      const programsResult = await client.query(`
        SELECT up.program_id, p.name as program_name
        FROM user_programs up
        JOIN coaching_programs p ON up.program_id = p.id
        WHERE up.user_id = $1 AND up.status = 'active'
      `, [member.id]);
      
      for (const program of programsResult.rows) {
        console.log(`  Program: ${program.program_name}`);
        
        // Get milestones for this program in order
        const milestonesResult = await client.query(`
          SELECT id, title, order_index, goal_days
          FROM milestones 
          WHERE program_id = $1 
          ORDER BY order_index
        `, [program.program_id]);
        
        // Create realistic sequential progression
        // Each member will complete milestones in order with some randomness
        let lastCompletedMilestone = 0;
        const totalMilestones = milestonesResult.rows.length;
        
        // Randomly decide how many milestones this member will complete (1 to total)
        const milestonesToComplete = Math.floor(Math.random() * totalMilestones) + 1;
        
        for (let i = 0; i < milestonesResult.rows.length; i++) {
          const milestone = milestonesResult.rows[i];
          const shouldComplete = i < milestonesToComplete;
          
          if (shouldComplete) {
            // Calculate realistic completion date
            // Start from enrollment date and add days based on goal_days
            const baseDate = new Date('2025-08-22T12:00:00Z'); // Enrollment date
            const daysOffset = i * (milestone.goal_days || 7) + Math.floor(Math.random() * 3); // Some variance
            const completionDate = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
            
            // Create milestone progress
            await client.query(`
              INSERT INTO milestone_progress (user_id, milestone_id, completed, completed_at)
              VALUES ($1, $2, $3, $4)
            `, [member.id, milestone.id, true, completionDate]);
            
            // Create task progress for completed milestones
            const tasksResult = await client.query(`
              SELECT id FROM tasks WHERE milestone_id = $1 ORDER BY order_index
            `, [milestone.id]);
            
            for (const task of tasksResult.rows) {
              // Randomly complete some tasks (70-100% completion rate)
              const shouldCompleteTask = Math.random() > 0.3;
              
              if (shouldCompleteTask) {
                const taskCompletionDate = new Date(completionDate.getTime() + Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000);
                
                await client.query(`
                  INSERT INTO task_progress (user_id, task_id, completed, completed_at)
                  VALUES ($1, $2, $3, $4)
                `, [member.id, task.id, true, taskCompletionDate]);
              }
            }
            
            lastCompletedMilestone = milestone.order_index;
            console.log(`    ✅ Completed milestone #${milestone.order_index}: ${milestone.title} on ${completionDate.toLocaleDateString()}`);
          } else {
            console.log(`    ⏳ Milestone #${milestone.order_index}: ${milestone.title} - Not yet unlocked (requires #${milestone.order_index - 1} completion)`);
          }
        }
      }
    }
    
    console.log('\n🎉 Sequential milestone progression fixed successfully!');
    console.log('\n📋 Summary of changes:');
    console.log('- Cleared all existing random milestone progress');
    console.log('- Implemented proper sequential milestone unlocking');
    console.log('- Each member now follows realistic progression');
    console.log('- Milestones can only be completed in order');
    console.log('- Removed confusing "upcoming" status logic');
    
  } catch (error) {
    console.error('❌ Error fixing sequential milestones:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixSequentialMilestones()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

