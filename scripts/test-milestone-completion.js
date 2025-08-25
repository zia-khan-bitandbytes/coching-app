const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
});

async function testMilestoneCompletion() {
  try {
    console.log('🔍 Testing Milestone Completion Tracking...\n');

    // Test 1: Check milestone_progress table structure
    console.log('1. Checking milestone_progress table structure...');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'milestone_progress' 
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:', tableStructure.rows.map(row => 
      `${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`
    ));

    // Test 2: Check if there are any completed milestones
    console.log('\n2. Checking for completed milestones...');
    const completedMilestones = await pool.query(`
      SELECT 
        mp.id,
        mp.user_id,
        mp.milestone_id,
        mp.completed,
        mp.completed_at,
        u.name as customer_name,
        m.title as milestone_title,
        cp.name as program_name
      FROM milestone_progress mp
      JOIN users u ON mp.user_id = u.id
      JOIN milestones m ON mp.milestone_id = m.id
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE mp.completed = true
      ORDER BY mp.completed_at DESC
      LIMIT 10
    `);

    if (completedMilestones.rows.length > 0) {
      console.log(`Found ${completedMilestones.rows.length} completed milestones:`);
      completedMilestones.rows.forEach(row => {
        console.log(`  • ${row.customer_name} completed "${row.milestone_title}" in ${row.program_name} at ${row.completed_at}`);
      });
    } else {
      console.log('No completed milestones found in the database.');
    }

    // Test 3: Check milestone completion counts by program
    console.log('\n3. Checking milestone completion counts by program...');
    const programMilestones = await pool.query(`
      SELECT 
        cp.id as program_id,
        cp.name as program_name,
        COUNT(DISTINCT m.id) as total_milestones,
        COUNT(DISTINCT mp.milestone_id) as completed_milestones,
        COUNT(DISTINCT up.user_id) as enrolled_users,
        COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.user_id END) as users_with_completed_milestones
      FROM coaching_programs cp
      LEFT JOIN milestones m ON cp.id = m.program_id
      LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.completed = true
      GROUP BY cp.id, cp.name
      ORDER BY cp.name
    `);

    console.log('Program milestone breakdown:');
    programMilestones.rows.forEach(row => {
      const completionRate = row.total_milestones > 0 ? 
        ((row.completed_milestones / row.total_milestones) * 100).toFixed(2) : 0;
      console.log(`  • ${row.program_name}: ${row.completed_milestones}/${row.total_milestones} milestones completed (${completionRate}%)`);
      console.log(`    Enrolled users: ${row.enrolled_users}, Users with completed milestones: ${row.users_with_completed_milestones}`);
    });

    // Test 4: Check customer milestone progress
    console.log('\n4. Checking customer milestone progress...');
    const customerProgress = await pool.query(`
      SELECT 
        u.id,
        u.name as customer_name,
        u.email,
        COUNT(DISTINCT mp.milestone_id) as completed_milestones,
        COUNT(DISTINCT up.program_id) as enrolled_programs
      FROM users u
      JOIN coach_customers cc ON u.id = cc.customer_id
      LEFT JOIN user_programs up ON u.id = up.user_id
      LEFT JOIN milestone_progress mp ON u.id = mp.user_id AND mp.completed = true
      GROUP BY u.id, u.name, u.email
      ORDER BY completed_milestones DESC
      LIMIT 10
    `);

    console.log('Customer progress breakdown:');
    customerProgress.rows.forEach(row => {
      console.log(`  • ${row.customer_name} (${row.email}): ${row.completed_milestones} milestones completed, ${row.enrolled_programs} programs enrolled`);
    });

    // Test 5: Verify the stats calculation query
    console.log('\n5. Testing the stats calculation query...');
    
    // First, let's check what coaches exist
    const coachesCheck = await pool.query(`
      SELECT c.id, c.business_name, u.name, u.email
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.id
    `);
    
    console.log('Available coaches:');
    coachesCheck.rows.forEach(row => {
      console.log(`  • Coach ID ${row.id}: ${row.business_name} (${row.name} - ${row.email})`);
    });
    
    // Use the first coach for testing
    const coachId = coachesCheck.rows[0]?.id || 1;
    console.log(`\nUsing coach ID ${coachId} for stats calculation...`);
    
    const statsTest = await pool.query(`
      WITH program_stats AS (
        SELECT 
          cp.id as program_id,
          COUNT(DISTINCT m.id) as total_milestones,
          COUNT(DISTINCT up.user_id) as enrolled_users,
          COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.user_id END) as users_with_completed_milestones
        FROM coaching_programs cp
        LEFT JOIN milestones m ON cp.id = m.program_id
        LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
        LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.completed = true
        WHERE cp.coach_id = $1
        GROUP BY cp.id
      ),
      overall_stats AS (
        SELECT 
          COUNT(DISTINCT cc.customer_id) as total_customers,
          COUNT(DISTINCT cp.id) as total_programs,
          SUM(ps.total_milestones) as total_milestones,
          COUNT(DISTINCT up.id) as active_enrollments,
          SUM(ps.users_with_completed_milestones) as total_completed_milestones,
          SUM(ps.total_milestones * ps.enrolled_users) as total_possible_milestones
        FROM coaches c
        LEFT JOIN coach_customers cc ON c.id = cc.coach_id
        LEFT JOIN coaching_programs cp ON c.id = cp.coach_id
        LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
        LEFT JOIN program_stats ps ON cp.id = ps.program_id
        WHERE c.id = $1
      )
      SELECT 
        total_customers,
        total_programs,
        total_milestones,
        active_enrollments,
        total_completed_milestones,
        total_possible_milestones,
        CASE 
          WHEN total_possible_milestones > 0 THEN 
            ROUND((total_completed_milestones::numeric / total_possible_milestones::numeric) * 100, 2)
          ELSE 0 
        END as completion_rate
      FROM overall_stats
    `, [coachId]);

    if (statsTest.rows.length > 0) {
      const stats = statsTest.rows[0];
      console.log('Stats calculation result:');
      console.log(`  • Total customers: ${stats.total_customers}`);
      console.log(`  • Total programs: ${stats.total_programs}`);
      console.log(`  • Total milestones: ${stats.total_milestones}`);
      console.log(`  • Active enrollments: ${stats.active_enrollments}`);
      console.log(`  • Total completed milestones: ${stats.total_completed_milestones}`);
      console.log(`  • Total possible milestones: ${stats.total_possible_milestones}`);
      console.log(`  • Completion rate: ${stats.completion_rate}%`);
    }

    console.log('\n✅ Milestone completion testing completed!');

  } catch (error) {
    console.error('❌ Error testing milestone completion:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testMilestoneCompletion();
