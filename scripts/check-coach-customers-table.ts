import pool from '../lib/db'

async function checkCoachCustomersTable() {
  try {
    console.log('=== CHECKING COACH_CUSTOMERS TABLE ===')
    
    // Test database connection
    console.log('Testing database connection...')
    const testResult = await pool.query('SELECT NOW() as current_time')
    console.log('Database connection successful:', testResult.rows[0])
    
    // Check if coach_customers table exists
    console.log('\nChecking if coach_customers table exists...')
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'coach_customers'
      )
    `)
    
    if (tableExists.rows[0].exists) {
      console.log('✅ coach_customers table exists')
      
      // Check table structure
      console.log('\nChecking table structure...')
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'coach_customers'
        ORDER BY ordinal_position
      `)
      
      console.log('Table columns:')
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`)
      })
      
      // Check if there are any coach-customer relationships
      console.log('\nChecking for existing coach-customer relationships...')
      const relationshipCount = await pool.query('SELECT COUNT(*) as count FROM coach_customers')
      console.log(`Total relationships: ${relationshipCount.rows[0].count}`)
      
      if (relationshipCount.rows[0].count > 0) {
        console.log('\nSample relationships:')
        const sampleRelationships = await pool.query(`
          SELECT 
            cc.coach_id,
            cc.customer_id,
            c.business_name as coach_name,
            u.name as customer_name
          FROM coach_customers cc
          JOIN coaches c ON cc.coach_id = c.id
          JOIN users u ON cc.customer_id = u.id
          LIMIT 5
        `)
        
        sampleRelationships.rows.forEach(rel => {
          console.log(`  - Coach ID ${rel.coach_id} (${rel.coach_name}) -> Customer ID ${rel.customer_id} (${rel.customer_name})`)
        })
      }
      
    } else {
      console.log('❌ coach_customers table does not exist')
      
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
    console.error('Error checking coach_customers table:', error)
  } finally {
    await pool.end()
    console.log('\n=== CHECK COMPLETE ===')
  }
}

checkCoachCustomersTable()
