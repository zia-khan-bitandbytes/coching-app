const { Pool } = require('pg');

// Database connection configuration - using the same credentials as lib/db.ts
const pool = new Pool({
  user: process.env.DB_USER || 'bitandbytes',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'coaching_app',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function quickFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Quick fix: Adding duration_days column...');
    
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
    
    console.log('✅ Duration column added successfully!');
    
    // Set default duration for existing programs
    await client.query(`
      UPDATE coaching_programs 
      SET duration_days = 30 
      WHERE duration_days IS NULL;
    `);
    
    console.log('✅ Default durations set for existing programs');
    
    // Verify the fix
    const result = await client.query(`
      SELECT COUNT(*) as total_programs, 
             COUNT(CASE WHEN duration_days IS NOT NULL THEN 1 END) as with_duration
      FROM coaching_programs;
    `);
    
    console.log('📊 Verification:', result.rows[0]);
    console.log('🎉 Quick fix completed! Your dashboard should work now.');
    
  } catch (error) {
    console.error('❌ Error during quick fix:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the quick fix
quickFix().catch(console.error);
