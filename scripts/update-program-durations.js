const { Pool } = require('pg');

// Database connection configuration - using the same credentials as lib/db.ts
const pool = new Pool({
  user: process.env.DB_USER || 'bitandbytes',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'coaching_app',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function updateProgramDurations() {
  const client = await pool.connect();
  
  try {
    console.log('Starting program duration updates...');
    
    // Add duration_days column if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'coaching_programs' 
              AND column_name = 'duration_days'
          ) THEN
              ALTER TABLE coaching_programs ADD COLUMN duration_days INTEGER DEFAULT 30;
              RAISE NOTICE 'Added duration_days column to coaching_programs table';
          ELSE
              RAISE NOTICE 'duration_days column already exists in coaching_programs table';
          END IF;
      END $$;
    `);
    
    console.log('✓ Duration column check completed');
    
    // Update existing programs with calculated duration based on milestone goals
    const updateResult = await client.query(`
      UPDATE coaching_programs 
      SET duration_days = (
          SELECT COALESCE(SUM(m.goal_days), 30)
          FROM milestones m 
          WHERE m.program_id = coaching_programs.id
      )
      WHERE duration_days = 30 OR duration_days IS NULL;
    `);
    
    console.log(`✓ Updated ${updateResult.rowCount} programs with calculated durations`);
    
    // Set minimum duration for programs without milestones
    const minDurationResult = await client.query(`
      UPDATE coaching_programs 
      SET duration_days = 30 
      WHERE duration_days IS NULL OR duration_days < 1;
    `);
    
    console.log(`✓ Set minimum duration for ${minDurationResult.rowCount} programs`);
    
    // Display the results
    const displayResult = await client.query(`
      SELECT 
          id,
          name,
          price,
          duration_days,
          CASE 
              WHEN duration_days > 0 THEN 
                  ROUND((price * 1.0) / (duration_days * 1.0 / 30), 2)
              ELSE 0 
          END as calculated_monthly_revenue
      FROM coaching_programs 
      ORDER BY id;
    `);
    
    console.log('\n📊 Program Duration and Revenue Summary:');
    console.log('ID | Name | Price | Duration (days) | Monthly Revenue');
    console.log('---|------|-------|-----------------|----------------');
    
    displayResult.rows.forEach(row => {
      console.log(`${row.id} | ${row.name} | $${row.price} | ${row.duration_days} | $${row.calculated_monthly_revenue}`);
    });
    
    // Calculate total monthly revenue
    const totalMonthlyRevenue = displayResult.rows.reduce((sum, row) => sum + parseFloat(row.calculated_monthly_revenue || 0), 0);
    console.log(`\n💰 Total Monthly Revenue: $${totalMonthlyRevenue.toFixed(2)}`);
    
    console.log('\n✅ Program duration update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating program durations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
updateProgramDurations().catch(console.error);
