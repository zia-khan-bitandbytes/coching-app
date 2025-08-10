import pool from '../lib/db';
import bcrypt from 'bcryptjs';

async function setupMultiTenantDatabase() {
  try {
    console.log('Setting up multi-tenant coaching database...');

    // Drop all existing tables first to ensure clean setup
    console.log('Dropping existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS message_reactions CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS milestone_progress CASCADE;
      DROP TABLE IF EXISTS user_programs CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS milestones CASCADE;
      DROP TABLE IF EXISTS coaching_programs CASCADE;
      DROP TABLE IF EXISTS coach_customers CASCADE;
      DROP TABLE IF EXISTS coaches CASCADE;
      DROP TABLE IF EXISTS reset_tokens CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('Existing tables dropped successfully');

    // Read the schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../lib/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the entire schema as one statement first
    try {
      await pool.query(schema);
      console.log('Schema executed successfully');
    } catch (error: any) {
      console.error('Error executing schema:', error.message);
    }

    // Create hashed passwords for sample users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Update existing users with hashed passwords
    await pool.query(`
      UPDATE users 
      SET password = $1 
      WHERE email IN (
        'admin@coachingapp.com',
        'coach1@example.com',
        'coach2@example.com',
        'coach3@example.com',
        'customer1@example.com',
        'customer2@example.com',
        'customer3@example.com',
        'customer4@example.com',
        'customer5@example.com'
      )
    `, [hashedPassword]);

    console.log('Multi-tenant database setup completed successfully!');
    console.log('\nSample users created:');
    console.log('Super Admin: admin@coachingapp.com / password123');
    console.log('Coach 1: coach1@example.com / password123');
    console.log('Coach 2: coach2@example.com / password123');
    console.log('Coach 3: coach3@example.com / password123');
    console.log('Customer 1: customer1@example.com / password123');
    console.log('Customer 2: customer2@example.com / password123');
    console.log('Customer 3: customer3@example.com / password123');
    console.log('Customer 4: customer4@example.com / password123');
    console.log('Customer 5: customer5@example.com / password123');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

setupMultiTenantDatabase(); 