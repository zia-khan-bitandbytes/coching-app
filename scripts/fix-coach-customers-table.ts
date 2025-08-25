import pool from '../lib/db'

async function fixCoachCustomersTable() {
  try {
    console.log('=== FIXING COACH_CUSTOMERS TABLE ===')
    
    // Test database connection
    console.log('Testing database connection...')
    const testResult = await pool.query('SELECT NOW() as current_time')
    console.log('Database connection successful:', testResult.rows[0])
    
    // Check current table structure
    console.log('\nChecking current table structure...')
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'coach_customers'
      ORDER BY ordinal_position
    `)
    
    console.log('Current columns:')
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`)
    })
    
    // Check if status column exists
    const statusColumnExists = columns.rows.some(col => col.column_name === 'status')
    
    if (!statusColumnExists) {
      console.log('\n❌ Status column missing. Adding it...')
      
      // Add status column
      await pool.query(`
        ALTER TABLE coach_customers 
        ADD COLUMN status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'))
      `)
      
      console.log('✅ Status column added successfully')
      
      // Update existing records to have 'active' status
      await pool.query(`
        UPDATE coach_customers 
        SET status = 'active' 
        WHERE status IS NULL
      `)
      
      console.log('✅ Existing records updated with active status')
      
    } else {
      console.log('\n✅ Status column already exists')
    }
    
    // Verify final table structure
    console.log('\nVerifying final table structure...')
    const finalColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'coach_customers'
      ORDER BY ordinal_position
    `)
    
    console.log('Final columns:')
    finalColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`)
    })
    
    // Check existing relationships
    console.log('\nChecking existing relationships...')
    const relationships = await pool.query(`
      SELECT 
        cc.coach_id,
        cc.customer_id,
        cc.status,
        c.business_name as coach_name,
        u.name as customer_name
      FROM coach_customers cc
      JOIN coaches c ON cc.coach_id = c.id
      JOIN users u ON cc.customer_id = u.id
    `)
    
    console.log(`Total relationships: ${relationships.rows.length}`)
    relationships.rows.forEach(rel => {
      console.log(`  - Coach ID ${rel.coach_id} (${rel.coach_name}) -> Customer ID ${rel.customer_id} (${rel.customer_name}) - Status: ${rel.status}`)
    })
    
    console.log('\n🎉 Coach customers table fixed successfully!')
    
  } catch (error) {
    console.error('Error fixing coach_customers table:', error)
  } finally {
    await pool.end()
    console.log('\n=== FIX COMPLETE ===')
  }
}

fixCoachCustomersTable()
