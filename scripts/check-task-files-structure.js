const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function checkTaskFilesStructure() {
  try {
    console.log('🔍 Checking task_files table structure...')
    
    // Check task_files table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'task_files'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📁 task_files table structure:')
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check sample data
    console.log('\n📊 Sample data from task_files:')
    const sampleData = await pool.query('SELECT * FROM task_files LIMIT 1')
    if (sampleData.rows.length > 0) {
      console.log('   Sample row:', sampleData.rows[0])
    } else {
      console.log('   No data in task_files table')
    }
    
    // Check tasks table structure
    console.log('\n✅ tasks table structure:')
    const taskColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `)
    
    taskColumns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkTaskFilesStructure()
