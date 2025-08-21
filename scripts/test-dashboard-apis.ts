import pool from '../lib/db'

async function testDashboardAPIs() {
  try {
    console.log('Testing Dashboard API Endpoints...')
    
    // Get a coach ID to test with
    const coachResult = await pool.query('SELECT id FROM coaches LIMIT 1')
    if (coachResult.rows.length === 0) {
      console.log('No coaches found in database')
      return
    }
    
    const coachId = coachResult.rows[0].id
    console.log(`Testing with coach ID: ${coachId}`)
    
    // Test 1: Check coach stats
    console.log('\n1. Testing Coach Stats API...')
    const statsQuery = `
      WITH program_stats AS (
        SELECT 
          cp.id as program_id,
          cp.price,
          cp.duration_days,
          COUNT(DISTINCT m.id) as total_milestones,
          COUNT(DISTINCT up.user_id) as enrolled_users,
          COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.user_id END) as users_with_completed_milestones
        FROM coaching_programs cp
        LEFT JOIN milestones m ON cp.id = m.program_id
        LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
        LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.completed = true
        WHERE cp.coach_id = $1
        GROUP BY cp.id, cp.price, cp.duration_days
      ),
      overall_stats AS (
        SELECT 
          COUNT(DISTINCT cc.customer_id) as total_customers,
          COUNT(DISTINCT cp.id) as total_programs,
          SUM(ps.total_milestones) as total_milestones,
          COUNT(DISTINCT up.id) as active_enrollments,
          0 as total_revenue,
          COALESCE(SUM(
            CASE 
              WHEN ps.duration_days > 0 THEN 
                (ps.price * ps.enrolled_users) / (ps.duration_days * 1.0 / 30)
              ELSE 0 
            END
          ), 0) as monthly_revenue,
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
        total_revenue,
        ROUND(monthly_revenue, 2) as monthly_revenue,
        CASE 
          WHEN total_possible_milestones > 0 THEN 
            ROUND((total_completed_milestones::numeric / total_possible_milestones::numeric) * 100, 2)
          ELSE 0 
        END as completion_rate
      FROM overall_stats
    `
    
    const statsResult = await pool.query(statsQuery, [coachId])
    console.log('Stats API Result:', statsResult.rows[0])
    
    // Test 2: Check coach customers
    console.log('\n2. Testing Coach Customers API...')
    const customersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT up.program_id) as total_programs,
        COUNT(DISTINCT CASE WHEN up.status = 'active' THEN up.program_id END) as active_programs,
        COUNT(DISTINCT mp.milestone_id) as completed_milestones,
        0 as total_spent,
        MAX(up.enrolled_at) as last_activity
      FROM users u
      JOIN coach_customers cc ON u.id = cc.customer_id
      LEFT JOIN user_programs up ON u.id = up.user_id
      LEFT JOIN milestone_progress mp ON u.id = mp.user_id AND mp.completed = true
      WHERE cc.coach_id = $1
      GROUP BY u.id, u.name, u.email
      ORDER BY u.name
    `
    
    const customersResult = await pool.query(customersQuery, [coachId])
    console.log(`Customers API Result: ${customersResult.rows.length} customers found`)
    if (customersResult.rows.length > 0) {
      console.log('Sample customer:', customersResult.rows[0])
    }
    
    // Test 3: Check coach programs
    console.log('\n3. Testing Coach Programs API...')
    const programsQuery = `
      SELECT 
        cp.id,
        cp.name,
        cp.description,
        cp.price,
        cp.duration_days,
        cp.created_at,
        COUNT(up.id) as members_count,
        0 as total_revenue,
        CASE 
          WHEN cp.duration_days > 0 THEN 
            ROUND((cp.price * COUNT(up.id)) / (cp.duration_days * 1.0 / 30), 2)
          ELSE 0 
        END as monthly_revenue
      FROM coaching_programs cp
      LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
      WHERE cp.coach_id = $1
      GROUP BY cp.id, cp.name, cp.description, cp.price, cp.duration_days, cp.created_at
      ORDER BY cp.created_at DESC
    `
    
    const programsResult = await pool.query(programsQuery, [coachId])
    console.log(`Programs API Result: ${programsResult.rows.length} programs found`)
    if (programsResult.rows.length > 0) {
      console.log('Sample program:', programsResult.rows[0])
    }
    
    // Test 4: Check milestone progress
    console.log('\n4. Testing Milestone Progress...')
    const progressQuery = `
      SELECT 
        m.id,
        m.title,
        m.goal_days,
        COUNT(mp.user_id) as completed_count,
        AVG(EXTRACT(EPOCH FROM (mp.completed_at - up.enrolled_at)) / 86400 as avg_completion_days
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      LEFT JOIN user_programs up ON cp.id = up.program_id
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.completed = true
      WHERE cp.coach_id = $1
      GROUP BY m.id, m.title, m.goal_days
    `
    
    const progressResult = await pool.query(progressQuery, [coachId])
    console.log(`Progress API Result: ${progressResult.rows.length} milestones found`)
    if (progressResult.rows.length > 0) {
      console.log('Sample milestone progress:', progressResult.rows[0])
    }
    
    console.log('\n✅ Dashboard API tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Error testing dashboard APIs:', error)
  } finally {
    await pool.end()
  }
}

testDashboardAPIs()
