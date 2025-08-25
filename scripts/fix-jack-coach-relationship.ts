import pool from '../lib/db'

async function fixJackCoachRelationship() {
  try {
    console.log('=== FIXING JACK\'S COACH RELATIONSHIP ===')
    
    // Test database connection
    console.log('Testing database connection...')
    const testResult = await pool.query('SELECT NOW() as current_time')
    console.log('Database connection successful:', testResult.rows[0])
    
    // Get Jack's user record
    console.log('\nGetting Jack\'s user record...')
    const jackUser = await pool.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE name ILIKE '%jack%' OR email ILIKE '%jack%'
    `)
    
    if (jackUser.rows.length === 0) {
      console.log('❌ Jack not found in users table')
      return
    }
    
    const jack = jackUser.rows[0]
    console.log(`✅ Found Jack: ID ${jack.id}, Name: ${jack.name}, Email: ${jack.email}`)
    
    // Get Jack's accepted invitation
    console.log('\nGetting Jack\'s accepted invitation...')
    const jackInvitation = await pool.query(`
      SELECT 
        i.id,
        i.coach_id,
        i.program_id,
        i.customer_email,
        i.customer_name,
        i.status,
        c.business_name as coach_name,
        cp.name as program_name
      FROM invitations i
      JOIN coaches c ON i.coach_id = c.id
      JOIN coaching_programs cp ON i.program_id = cp.id
      WHERE i.customer_email = $1 AND i.status = 'accepted'
    `, [jack.email])
    
    if (jackInvitation.rows.length === 0) {
      console.log('❌ No accepted invitation found for Jack')
      return
    }
    
    const invitation = jackInvitation.rows[0]
    console.log(`✅ Found invitation: Coach: ${invitation.coach_name}, Program: ${invitation.program_name}`)
    
    // Check if Jack is already linked to the coach
    console.log('\nChecking if Jack is already linked to coach...')
    const existingLink = await pool.query(`
      SELECT * FROM coach_customers 
      WHERE coach_id = $1 AND customer_id = $2
    `, [invitation.coach_id, jack.id])
    
    if (existingLink.rows.length > 0) {
      console.log('✅ Jack is already linked to coach, updating status...')
      await pool.query(`
        UPDATE coach_customers 
        SET status = 'active' 
        WHERE coach_id = $1 AND customer_id = $2
      `, [invitation.coach_id, jack.id])
    } else {
      console.log('❌ Jack is NOT linked to coach, creating relationship...')
      await pool.query(`
        INSERT INTO coach_customers (coach_id, customer_id, status)
        VALUES ($1, $2, 'active')
      `, [invitation.coach_id, jack.id])
      console.log('✅ Coach-customer relationship created')
    }
    
    // Check if Jack is enrolled in the program
    console.log('\nChecking if Jack is enrolled in the program...')
    const existingEnrollment = await pool.query(`
      SELECT * FROM user_programs 
      WHERE user_id = $1 AND program_id = $2
    `, [jack.id, invitation.program_id])
    
    if (existingEnrollment.rows.length > 0) {
      console.log('✅ Jack is already enrolled in program, updating status...')
      await pool.query(`
        UPDATE user_programs 
        SET status = 'active' 
        WHERE user_id = $1 AND program_id = $2
      `, [jack.id, invitation.program_id])
    } else {
      console.log('❌ Jack is NOT enrolled in program, creating enrollment...')
      await pool.query(`
        INSERT INTO user_programs (user_id, program_id, status)
        VALUES ($1, $2, 'active')
      `, [jack.id, invitation.program_id])
      console.log('✅ Program enrollment created')
    }
    
    // Verify the fix
    console.log('\nVerifying the fix...')
    
    // Check coach relationship
    const coachCheck = await pool.query(`
      SELECT 
        cc.coach_id,
        cc.status,
        c.business_name as coach_name
      FROM coach_customers cc
      JOIN coaches c ON cc.coach_id = c.id
      WHERE cc.customer_id = $1
    `, [jack.id])
    
    if (coachCheck.rows.length > 0) {
      console.log('✅ Coach relationship verified:')
      coachCheck.rows.forEach(rel => {
        console.log(`  - Coach ID: ${rel.coach_id}, Name: ${rel.coach_name}, Status: ${rel.status}`)
      })
    } else {
      console.log('❌ Coach relationship still missing')
    }
    
    // Check program enrollment
    const programCheck = await pool.query(`
      SELECT 
        up.program_id,
        up.status,
        cp.name as program_name
      FROM user_programs up
      JOIN coaching_programs cp ON up.program_id = cp.id
      WHERE up.user_id = $1
    `, [jack.id])
    
    if (programCheck.rows.length > 0) {
      console.log('✅ Program enrollment verified:')
      programCheck.rows.forEach(prog => {
        console.log(`  - Program ID: ${prog.program_id}, Name: ${prog.program_name}, Status: ${prog.status}`)
      })
    } else {
      console.log('❌ Program enrollment still missing')
    }
    
    console.log('\n🎉 Jack\'s coach relationship and program enrollment have been fixed!')
    console.log('He should now be able to see his roadmap in the dashboard.')
    
  } catch (error) {
    console.error('Error fixing Jack\'s coach relationship:', error)
  } finally {
    await pool.end()
    console.log('\n=== FIX COMPLETE ===')
  }
}

fixJackCoachRelationship()
