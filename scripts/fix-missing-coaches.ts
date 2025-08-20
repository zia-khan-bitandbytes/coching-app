import pool from '../lib/db'

async function fixMissingCoaches() {
  try {
    console.log('Fixing missing coach records...')

    // Find users with coach role who don't have coach records
    const result = await pool.query(`
      SELECT u.id, u.name, u.email 
      FROM users u 
      LEFT JOIN coaches c ON u.id = c.user_id 
      WHERE u.role = 'coach' AND c.id IS NULL
    `)

    if (result.rows.length === 0) {
      console.log('No missing coach records found!')
      return
    }

    console.log(`Found ${result.rows.length} users with missing coach records:`)
    result.rows.forEach(row => {
      console.log(`- ${row.name} (${row.email}) - ID: ${row.id}`)
    })

    // Create missing coach records
    for (const user of result.rows) {
      try {
        await pool.query(
          'INSERT INTO coaches (user_id, business_name, bio, specialization) VALUES ($1, $2, $3, $4)',
          [user.id, `${user.name}'s Coaching Business`, `Welcome to ${user.name}'s coaching services`, 'General Coaching']
        )
        console.log(`✅ Created coach record for ${user.name}`)
      } catch (error) {
        console.error(`❌ Failed to create coach record for ${user.name}:`, error)
      }
    }

    console.log('\nCoach record fix completed!')
  } catch (error) {
    console.error('Error fixing missing coaches:', error)
    throw error
  } finally {
    await pool.end()
  }
}

fixMissingCoaches()
