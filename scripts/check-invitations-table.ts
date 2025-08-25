import pool from '../lib/db'

async function checkInvitationsTable() {
  try {
    console.log('=== CHECKING INVITATIONS TABLE ===')
    
    // Test database connection
    console.log('Testing database connection...')
    const testResult = await pool.query('SELECT NOW() as current_time')
    console.log('Database connection successful:', testResult.rows[0])
    
    // Check if invitations table exists
    console.log('\nChecking if invitations table exists...')
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invitations'
      )
    `)
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Invitations table exists')
      
      // Check table structure
      console.log('\nChecking table structure...')
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'invitations'
        ORDER BY ordinal_position
      `)
      
      console.log('Table columns:')
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`)
      })
      
      // Check if there are any invitations
      console.log('\nChecking for existing invitations...')
      const invitationCount = await pool.query('SELECT COUNT(*) as count FROM invitations')
      console.log(`Total invitations: ${invitationCount.rows[0].count}`)
      
      if (invitationCount.rows[0].count > 0) {
        console.log('\nSample invitation data:')
        const sampleInvitation = await pool.query('SELECT * FROM invitations LIMIT 1')
        console.log(sampleInvitation.rows[0])
      }
      
    } else {
      console.log('❌ Invitations table does not exist')
      
      // Check what tables do exist
      console.log('\nAvailable tables:')
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)
      
      tables.rows.forEach(table => {
        console.log(`  - ${table.table_name}`)
      })
    }
    
  } catch (error) {
    console.error('Error checking invitations table:', error)
  } finally {
    await pool.end()
    console.log('\n=== CHECK COMPLETE ===')
  }
}

checkInvitationsTable()
