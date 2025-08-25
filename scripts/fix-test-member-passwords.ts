import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Database configuration matching the project
const pool = new Pool({
  user: process.env.DB_USER || 'bitandbytes',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'coaching_app',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function fixTestMemberPasswords() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing test member passwords...\n');
    
    // Get all test members
    const testMembersResult = await client.query(`
      SELECT id, name, email FROM users 
      WHERE email LIKE '%@test.com' 
      ORDER BY id
    `);
    
    if (testMembersResult.rows.length === 0) {
      console.log('❌ No test members found');
      return;
    }
    
    console.log(`Found ${testMembersResult.rows.length} test members to fix:\n`);
    
    // Fix password for each test member
    for (const member of testMembersResult.rows) {
      const newPasswordHash = await bcrypt.hash('password123', 10);
      
      await client.query(`
        UPDATE users 
        SET password_hash = $1 
        WHERE id = $2
      `, [newPasswordHash, member.id]);
      
      console.log(`✅ Fixed password for: ${member.name} (${member.email})`);
    }
    
    // Also fix Coach1 password to ensure it works
    const coach1PasswordHash = await bcrypt.hash('password123', 10);
    await client.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE email = 'coach1@example.com'
    `, [coach1PasswordHash]);
    
    console.log(`✅ Fixed password for: Coach1 (coach1@example.com)`);
    
    console.log('\n🎉 All test member passwords have been fixed!');
    console.log('\n📋 Login Credentials:');
    console.log('All test members and Coach1 now use: password123');
    console.log('\nTest Members:');
    testMembersResult.rows.forEach(member => {
      console.log(`- ${member.name}: ${member.email} / password123`);
    });
    console.log(`- Coach1: coach1@example.com / password123`);
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixTestMemberPasswords()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

