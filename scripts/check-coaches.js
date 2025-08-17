const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/diego_coaching_app'
});

async function checkCoaches() {
  try {
    console.log('🔍 Checking coaches in database...\n');
    
    // Check users with coach role
    const usersResult = await pool.query(`
      SELECT id, email, name, role 
      FROM users 
      WHERE role = 'coach'
      ORDER BY id
    `);
    
    console.log('👥 Users with coach role:');
    usersResult.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    console.log('\n🏢 Coaches table entries:');
    const coachesResult = await pool.query(`
      SELECT c.id as coach_id, c.user_id, c.business_name, u.name, u.email
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.id
    `);
    
    coachesResult.rows.forEach(coach => {
      console.log(`  - Coach ID: ${coach.coach_id}, User ID: ${coach.user_id}, Business: ${coach.business_name}, Name: ${coach.name}`);
    });
    
    console.log('\n📊 Summary:');
    console.log(`  - Total users with coach role: ${usersResult.rows.length}`);
    console.log(`  - Total entries in coaches table: ${coachesResult.rows.length}`);
    
    // Check for users with coach role but no coaches table entry
    const missingCoaches = usersResult.rows.filter(user => 
      !coachesResult.rows.some(coach => coach.user_id === user.id)
    );
    
    if (missingCoaches.length > 0) {
      console.log('\n⚠️  Users with coach role but missing coaches table entry:');
      missingCoaches.forEach(user => {
        console.log(`  - User ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking coaches:', error);
  } finally {
    await pool.end();
  }
}

checkCoaches(); 