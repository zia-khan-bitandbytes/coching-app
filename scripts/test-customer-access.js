const { Pool } = require('pg');

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
});

async function testCustomerAccess() {
  try {
    console.log('Testing customer access verification...\n');
    
    const customerId = '2';
    const taskId = '80';
    const milestoneId = '33';
    
    console.log('Parameters:', { customerId, taskId, milestoneId });
    
    // Test the verification query
    const verificationResult = await pool.query(`
      SELECT t.id, m.id as milestone_id, cp.coach_id, cp.id as program_id
      FROM tasks t
      JOIN milestones m ON t.milestone_id = m.id
      JOIN coaching_programs cp ON m.program_id = cp.id
      JOIN user_programs up ON cp.id = up.program_id
      WHERE t.id = $1 AND m.id = $2 AND up.user_id = $3
    `, [taskId, milestoneId, customerId]);

    console.log('Verification result:', verificationResult.rows);
    
    if (verificationResult.rows.length === 0) {
      console.log('❌ No access found');
      
      // Let's check each part of the query separately
      console.log('\n--- Debugging each part of the query ---');
      
      // Check if task exists
      const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      console.log('Task exists:', taskResult.rows.length > 0);
      if (taskResult.rows.length > 0) {
        console.log('Task data:', taskResult.rows[0]);
      }
      
      // Check if milestone exists
      const milestoneResult = await pool.query('SELECT * FROM milestones WHERE id = $1', [milestoneId]);
      console.log('Milestone exists:', milestoneResult.rows.length > 0);
      if (milestoneResult.rows.length > 0) {
        console.log('Milestone data:', milestoneResult.rows[0]);
      }
      
      // Check if user is enrolled in any programs
      const userProgramsResult = await pool.query('SELECT * FROM user_programs WHERE user_id = $1', [customerId]);
      console.log('User programs:', userProgramsResult.rows);
      
      // Check if the task's milestone belongs to a program the user is enrolled in
      if (taskResult.rows.length > 0 && userProgramsResult.rows.length > 0) {
        const taskMilestoneId = taskResult.rows[0].milestone_id;
        const userProgramIds = userProgramsResult.rows.map(row => row.program_id);
        
        const milestoneProgramResult = await pool.query(`
          SELECT m.id as milestone_id, m.program_id, cp.id as program_id, cp.name as program_name
          FROM milestones m
          JOIN coaching_programs cp ON m.program_id = cp.id
          WHERE m.id = $1
        `, [taskMilestoneId]);
        
        console.log('Task milestone program:', milestoneProgramResult.rows);
        console.log('User enrolled programs:', userProgramIds);
        
        const hasAccess = milestoneProgramResult.rows.some(row => 
          userProgramIds.includes(row.program_id)
        );
        console.log('User has access to task milestone program:', hasAccess);
      }
      
    } else {
      console.log('✅ Access granted');
      console.log('Task data:', verificationResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testCustomerAccess().catch(console.error); 