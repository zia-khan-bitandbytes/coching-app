const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function checkUserPrograms() {
  try {
    console.log('🔍 Checking user_programs table structure...')
    
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_programs'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 user_programs table structure:')
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check sample data
    console.log('\n📊 Sample data from user_programs:')
    const sampleData = await pool.query('SELECT * FROM user_programs LIMIT 2')
    if (sampleData.rows.length > 0) {
      sampleData.rows.forEach((row, index) => {
        console.log(`  Row ${index + 1}:`, row)
      })
    } else {
      console.log('  No data found')
    }
    
    // Check if the join query would work
    console.log('\n🔍 Testing the join query...')
    try {
      const testQuery = await pool.query(`
        SELECT 
          cp.id,
          cp.title as name,
          cp.description,
          cp.price,
          up.enrolled_at,
          c.business_name as coach_business_name
        FROM coaching_programs cp
        JOIN user_programs up ON cp.id = up.program_id
        JOIN coaches c ON cp.coach_id = c.id
        WHERE up.user_id = 2
      `)
      
      console.log('✅ Join query successful, found rows:', testQuery.rows.length)
      if (testQuery.rows.length > 0) {
        console.log('  Sample result:', testQuery.rows[0])
      }
    } catch (error) {
      console.error('❌ Join query failed:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Error checking user_programs:', error)
  } finally {
    await pool.end()
  }
}

checkUserPrograms()
