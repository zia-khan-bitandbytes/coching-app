const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function debugCoachView() {
  try {
    console.log('🔍 Debugging coach view issues...')
    
    // 1. Check coach information
    console.log('\n👨‍🏫 Coach Information:')
    const coach = await pool.query(`
      SELECT 
        c.id as coach_id,
        c.business_name,
        u.id as user_id,
        u.email,
        u.name
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      WHERE u.email = 'coach1@example.com'
    `)
    
    if (coach.rows.length > 0) {
      console.log('✅ Coach found:', coach.rows[0])
    } else {
      console.log('❌ Coach not found!')
      return
    }
    
    const coachId = coach.rows[0].coach_id
    
    // 2. Check programs owned by this coach
    console.log('\n📚 Programs owned by coach:')
    const programs = await pool.query(`
      SELECT 
        id,
        name,
        description,
        price,
        duration_days,
        coach_id
      FROM coaching_programs
      WHERE coach_id = $1
    `, [coachId])
    
    if (programs.rows.length > 0) {
      console.log('✅ Programs found:', programs.rows.length)
      programs.rows.forEach(program => {
        console.log(`   - ${program.name} (ID: ${program.id})`)
      })
    } else {
      console.log('❌ No programs found for this coach!')
    }
    
    // 3. Check milestones in programs
    console.log('\n🎯 Milestones in programs:')
    const milestones = await pool.query(`
      SELECT 
        m.id,
        m.title,
        m.program_id,
        cp.name as program_name
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE cp.coach_id = $1
    `, [coachId])
    
    if (milestones.rows.length > 0) {
      console.log('✅ Milestones found:', milestones.rows.length)
      milestones.rows.forEach(milestone => {
        console.log(`   - ${milestone.title} (Program: ${milestone.program_name})`)
      })
    } else {
      console.log('❌ No milestones found!')
    }
    
    // 4. Check customer enrollments
    console.log('\n👥 Customer enrollments:')
    const enrollments = await pool.query(`
      SELECT 
        up.user_id,
        up.program_id,
        u.name as customer_name,
        u.email as customer_email,
        cp.name as program_name
      FROM user_programs up
      JOIN users u ON up.user_id = u.id
      JOIN coaching_programs cp ON up.program_id = cp.id
      WHERE cp.coach_id = $1
    `, [coachId])
    
    if (enrollments.rows.length > 0) {
      console.log('✅ Enrollments found:', enrollments.rows.length)
      enrollments.rows.forEach(enrollment => {
        console.log(`   - ${enrollment.customer_name} enrolled in ${enrollment.program_name}`)
      })
    } else {
      console.log('❌ No enrollments found!')
    }
    
    // 5. Check milestone progress
    console.log('\n📊 Milestone progress:')
    const progress = await pool.query(`
      SELECT 
        mp.user_id,
        mp.milestone_id,
        mp.completed,
        mp.started_at,
        mp.completed_at,
        u.name as customer_name,
        m.title as milestone_title
      FROM milestone_progress mp
      JOIN users u ON mp.user_id = u.id
      JOIN milestones m ON mp.milestone_id = m.id
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE cp.coach_id = $1
      ORDER BY u.name, m.order_index
    `, [coachId])
    
    if (progress.rows.length > 0) {
      console.log('✅ Progress found:', progress.rows.length)
      progress.rows.forEach(p => {
        const status = p.completed ? '✅ Completed' : '⏳ In Progress'
        console.log(`   - ${p.customer_name}: ${p.milestone_title} - ${status}`)
      })
    } else {
      console.log('❌ No progress found!')
    }
    
    // 6. Check if there are any data inconsistencies
    console.log('\n🔍 Data consistency check:')
    
    // Check if programs exist but aren't linked to coach
    const orphanedPrograms = await pool.query(`
      SELECT id, name, coach_id
      FROM coaching_programs
      WHERE coach_id IS NULL OR coach_id NOT IN (SELECT id FROM coaches)
    `)
    
    if (orphanedPrograms.rows.length > 0) {
      console.log('⚠️ Orphaned programs found:', orphanedPrograms.rows.length)
      orphanedPrograms.rows.forEach(p => {
        console.log(`   - ${p.name} (Coach ID: ${p.coach_id})`)
      })
    } else {
      console.log('✅ No orphaned programs found')
    }
    
    // Check if milestones exist but aren't linked to programs
    const orphanedMilestones = await pool.query(`
      SELECT m.id, m.title, m.program_id
      FROM milestones m
      LEFT JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE cp.id IS NULL
    `)
    
    if (orphanedMilestones.rows.length > 0) {
      console.log('⚠️ Orphaned milestones found:', orphanedMilestones.rows.length)
      orphanedMilestones.rows.forEach(m => {
        console.log(`   - ${m.title} (Program ID: ${m.program_id})`)
      })
    } else {
      console.log('✅ No orphaned milestones found')
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error)
  } finally {
    await pool.end()
  }
}

debugCoachView()
