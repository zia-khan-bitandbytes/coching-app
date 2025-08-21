import pool from '../lib/db'

async function checkJackInvitation() {
  try {
    console.log('=== CHECKING JACK\'S INVITATION STATUS ===')
    
    // Test database connection
    console.log('Testing database connection...')
    const testResult = await pool.query('SELECT NOW() as current_time')
    console.log('Database connection successful:', testResult.rows[0])
    
    // Check if jack exists in users table
    console.log('\nChecking if jack exists in users table...')
    const jackUser = await pool.query(`
      SELECT id, name, email, role, created_at 
      FROM users 
      WHERE name ILIKE '%jack%' OR email ILIKE '%jack%'
    `)
    
    if (jackUser.rows.length > 0) {
      console.log('✅ Jack found in users table:')
      jackUser.rows.forEach(user => {
        console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`)
      })
      
      // Check if jack is linked to any coach
      const jackCoach = await pool.query(`
        SELECT 
          cc.coach_id,
          cc.status,
          c.business_name as coach_name,
          u.name as coach_user_name
        FROM coach_customers cc
        JOIN coaches c ON cc.coach_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE cc.customer_id = $1
      `, [jackUser.rows[0].id])
      
      if (jackCoach.rows.length > 0) {
        console.log('\n✅ Jack is linked to coach:')
        jackCoach.rows.forEach(rel => {
          console.log(`  - Coach ID: ${rel.coach_id}, Name: ${rel.coach_name}, Status: ${rel.status}`)
        })
      } else {
        console.log('\n❌ Jack is NOT linked to any coach')
      }
      
      // Check if jack is enrolled in any programs
      const jackPrograms = await pool.query(`
        SELECT 
          up.program_id,
          up.status,
          cp.name as program_name,
          cp.price
        FROM user_programs up
        JOIN coaching_programs cp ON up.program_id = cp.id
        WHERE up.user_id = $1
      `, [jackUser.rows[0].id])
      
      if (jackPrograms.rows.length > 0) {
        console.log('\n✅ Jack is enrolled in programs:')
        jackPrograms.rows.forEach(prog => {
          console.log(`  - Program ID: ${prog.program_id}, Name: ${prog.program_name}, Status: ${prog.status}`)
        })
      } else {
        console.log('\n❌ Jack is NOT enrolled in any programs')
      }
      
    } else {
      console.log('❌ Jack not found in users table')
    }
    
    // Check all invitations
    console.log('\nChecking all invitations...')
    const allInvitations = await pool.query(`
      SELECT 
        i.id,
        i.token,
        i.coach_id,
        i.program_id,
        i.customer_email,
        i.customer_name,
        i.status,
        i.created_at,
        i.accepted_at,
        c.business_name as coach_name,
        cp.name as program_name
      FROM invitations i
      JOIN coaches c ON i.coach_id = c.id
      JOIN coaching_programs cp ON i.program_id = cp.id
      ORDER BY i.created_at DESC
    `)
    
    console.log(`Total invitations: ${allInvitations.rows.length}`)
    allInvitations.rows.forEach(inv => {
      console.log(`\n  - ID: ${inv.id}`)
      console.log(`    Token: ${inv.token}`)
      console.log(`    Customer: ${inv.customer_name} (${inv.customer_email})`)
      console.log(`    Coach: ${inv.coach_name}`)
      console.log(`    Program: ${inv.program_name}`)
      console.log(`    Status: ${inv.status}`)
      console.log(`    Created: ${inv.created_at}`)
      console.log(`    Accepted: ${inv.accepted_at || 'Not accepted'}`)
    })
    
    // Check if there's an invitation for jack
    const jackInvitation = allInvitations.rows.find(inv => 
      inv.customer_name.toLowerCase().includes('jack') || 
      inv.customer_email.toLowerCase().includes('jack')
    )
    
    if (jackInvitation) {
      console.log('\n🎯 Found invitation for Jack:')
      console.log(`  - Status: ${jackInvitation.status}`)
      console.log(`  - Accepted at: ${jackInvitation.accepted_at || 'Not accepted'}`)
      
      if (jackInvitation.status === 'accepted' && jackInvitation.accepted_at) {
        console.log('  - This invitation was accepted, but jack might not be properly linked')
      }
    } else {
      console.log('\n❌ No invitation found for Jack')
    }
    
  } catch (error) {
    console.error('Error checking jack invitation:', error)
  } finally {
    await pool.end()
    console.log('\n=== CHECK COMPLETE ===')
  }
}

checkJackInvitation()
