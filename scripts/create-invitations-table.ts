import pool from '../lib/db'

async function createInvitationsTable() {
  try {
    console.log('=== CREATING INVITATIONS TABLE ===')
    
    // Test database connection
    console.log('Testing database connection...')
    const testResult = await pool.query('SELECT NOW() as current_time')
    console.log('Database connection successful:', testResult.rows[0])
    
    // Create invitations table
    console.log('\nCreating invitations table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
        program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
      )
    `)
    console.log('✅ Invitations table created')
    
    // Create indexes
    console.log('\nCreating indexes...')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_invitations_coach_id ON invitations(coach_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_invitations_program_id ON invitations(program_id)')
    console.log('✅ Indexes created')
    
    // Verify table structure
    console.log('\nVerifying table structure...')
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
    
    // Insert a test invitation
    console.log('\nInserting test invitation...')
    const testInvitation = await pool.query(`
      INSERT INTO invitations (token, coach_id, program_id, customer_email, customer_name, status, expires_at)
      VALUES (
        'test-token-123',
        (SELECT id FROM coaches LIMIT 1),
        (SELECT id FROM coaching_programs LIMIT 1),
        'test@example.com',
        'Test User',
        'pending',
        (CURRENT_TIMESTAMP + INTERVAL '7 days')
      ) ON CONFLICT DO NOTHING
      RETURNING *
    `)
    
    if (testInvitation.rows.length > 0) {
      console.log('✅ Test invitation inserted:', testInvitation.rows[0])
    } else {
      console.log('ℹ️ Test invitation already exists or failed to insert')
    }
    
    console.log('\n🎉 Invitations table setup complete!')
    
  } catch (error) {
    console.error('Error creating invitations table:', error)
  } finally {
    await pool.end()
    console.log('\n=== SETUP COMPLETE ===')
  }
}

createInvitationsTable()
