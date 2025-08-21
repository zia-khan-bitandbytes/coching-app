const { Pool } = require('pg')

// Database configuration
const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function simpleReset() {
  try {
    console.log('🔄 Starting simple database reset...')
    
    // Step 1: Drop all tables
    console.log('🗑️ Dropping all tables...')
    await pool.query('DROP TABLE IF EXISTS task_files CASCADE')
    await pool.query('DROP TABLE IF EXISTS task_progress CASCADE')
    await pool.query('DROP TABLE IF EXISTS milestone_progress CASCADE')
    await pool.query('DROP TABLE IF EXISTS tasks CASCADE')
    await pool.query('DROP TABLE IF EXISTS user_programs CASCADE')
    await pool.query('DROP TABLE IF EXISTS milestones CASCADE')
    await pool.query('DROP TABLE IF EXISTS coaching_programs CASCADE')
    await pool.query('DROP TABLE IF EXISTS coach_customers CASCADE')
    await pool.query('DROP TABLE IF EXISTS coaches CASCADE')
    await pool.query('DROP TABLE IF EXISTS users CASCADE')
    console.log('✅ All tables dropped')
    
    // Step 2: Create users table
    console.log('👥 Creating users table...')
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'coach', 'customer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Users table created')
    
    // Step 3: Create coaches table
    console.log('👨‍🏫 Creating coaches table...')
    await pool.query(`
      CREATE TABLE coaches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        bio TEXT,
        specialization VARCHAR(255),
        hourly_rate DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Coaches table created')
    
    // Step 4: Create coaching_programs table
    console.log('📚 Creating coaching_programs table...')
    await pool.query(`
      CREATE TABLE coaching_programs (
        id SERIAL PRIMARY KEY,
        coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        duration_days INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Coaching_programs table created')
    
    // Step 5: Create user_programs table
    console.log('📖 Creating user_programs table...')
    await pool.query(`
      CREATE TABLE user_programs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
        UNIQUE(user_id, program_id)
      )
    `)
    console.log('✅ User_programs table created')
    
    // Step 6: Create milestones table
    console.log('🎯 Creating milestones table...')
    await pool.query(`
      CREATE TABLE milestones (
        id SERIAL PRIMARY KEY,
        program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL,
        goal_days INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Milestones table created')
    
    // Step 7: Create milestone_progress table with started_at
    console.log('📊 Creating milestone_progress table...')
    await pool.query(`
      CREATE TABLE milestone_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT FALSE,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, milestone_id)
      )
    `)
    console.log('✅ Milestone_progress table created')
    
    // Step 8: Create tasks table
    console.log('✅ Creating tasks table...')
    await pool.query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL,
        requires_upload BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tasks table created')
    
    // Step 9: Create task_progress table
    console.log('📝 Creating task_progress table...')
    await pool.query(`
      CREATE TABLE task_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, task_id)
      )
    `)
    console.log('✅ Task_progress table created')
    
    // Step 10: Create task_files table
    console.log('📁 Creating task_files table...')
    await pool.query(`
      CREATE TABLE task_files (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(100),
        uploaded_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Task_files table created')
    
    // Step 11: Create coach_customers table
    console.log('🔗 Creating coach_customers table...')
    await pool.query(`
      CREATE TABLE coach_customers (
        coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (coach_id, customer_id)
      )
    `)
    console.log('✅ Coach_customers table created')
    
    // Step 12: Create indexes
    console.log('🔍 Creating indexes...')
    await pool.query('CREATE INDEX idx_users_email ON users(email)')
    await pool.query('CREATE INDEX idx_users_role ON users(role)')
    await pool.query('CREATE INDEX idx_coaches_user_id ON coaches(user_id)')
    await pool.query('CREATE INDEX idx_coaching_programs_coach_id ON coaching_programs(coach_id)')
    await pool.query('CREATE INDEX idx_user_programs_user_id ON user_programs(user_id)')
    await pool.query('CREATE INDEX idx_user_programs_program_id ON user_programs(program_id)')
    await pool.query('CREATE INDEX idx_milestones_program_id ON milestones(program_id)')
    await pool.query('CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id)')
    await pool.query('CREATE INDEX idx_milestone_progress_user_id ON milestone_progress(user_id)')
    await pool.query('CREATE INDEX idx_milestone_progress_milestone_id ON milestone_progress(milestone_id)')
    await pool.query('CREATE INDEX idx_task_progress_user_id ON task_progress(user_id)')
    await pool.query('CREATE INDEX idx_task_progress_task_id ON task_progress(task_id)')
    await pool.query('CREATE INDEX idx_task_files_task_id ON task_files(task_id)')
    await pool.query('CREATE INDEX idx_coach_customers_coach_id ON coach_customers(coach_id)')
    console.log('✅ All indexes created')
    
    // Step 13: Insert test data
    console.log('📊 Inserting test data...')
    
    // Insert users
    await pool.query(`
      INSERT INTO users (email, name, password, role) VALUES
        ('admin@coachingapp.com', 'Super Admin', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'super_admin'),
        ('coach1@example.com', 'John Smith', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'coach'),
        ('customer1@example.com', 'Jessica Lee', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer'),
        ('customer2@example.com', 'Alex Thompson', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer'),
        ('customer3@example.com', 'Sarah Wilson', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer')
    `)
    console.log('✅ Users inserted')
    
    // Insert coach
    await pool.query(`
      INSERT INTO coaches (user_id, business_name, bio, specialization, hourly_rate) VALUES
        ((SELECT id FROM users WHERE email = 'coach1@example.com'), 'Business Growth Academy', 'Expert in scaling businesses from startup to enterprise', 'Business Strategy & Growth', 150.00)
    `)
    console.log('✅ Coach inserted')
    
    // Insert program
    await pool.query(`
      INSERT INTO coaching_programs (coach_id, name, description, price, duration_days) VALUES
        ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), 'Startup Success Blueprint', 'Complete guide to launching and scaling your startup', 2999.00, 120)
    `)
    console.log('✅ Program inserted')
    
    // Insert milestones
    await pool.query(`
      INSERT INTO milestones (program_id, title, description, order_index, goal_days) VALUES
        ((SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), 'CHAPTER 1: Foundation', 'Build your business foundation and validate your idea', 1, 30),
        ((SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), 'Chapter 5: Growth', 'Scale your operations and customer base', 2, 30),
        ((SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), 'Chapter 10: Optimization', 'Optimize processes and maximize efficiency', 3, 30),
        ((SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), 'Chapter 15: Expansion', 'Expand to new markets and opportunities', 4, 30)
    `)
    console.log('✅ Milestones inserted')
    
    // Insert tasks
    await pool.query(`
      INSERT INTO tasks (milestone_id, title, description, order_index, requires_upload) VALUES
        ((SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1), 'Market Research', 'Conduct comprehensive market research', 1, true),
        ((SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1), 'Business Plan', 'Create detailed business plan', 2, true),
        ((SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1), 'Legal Setup', 'Set up business legal structure', 3, false),
        ((SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2), 'Customer Acquisition', 'Implement customer acquisition strategy', 1, true),
        ((SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2), 'Team Building', 'Build and train your team', 2, false),
        ((SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2), 'Process Optimization', 'Optimize business processes', 3, true),
        ((SELECT id FROM milestones WHERE title = 'Chapter 10: Optimization' AND order_index = 3), 'Performance Review', 'Review and analyze performance metrics', 1, true),
        ((SELECT id FROM milestones WHERE title = 'Chapter 10: Optimization' AND order_index = 3), 'Efficiency Audit', 'Conduct efficiency audit', 2, true),
        ((SELECT id FROM milestones WHERE title = 'Chapter 15: Expansion' AND order_index = 4), 'Market Analysis', 'Analyze new market opportunities', 1, true),
        ((SELECT id FROM milestones WHERE title = 'Chapter 15: Expansion' AND order_index = 4), 'Expansion Plan', 'Create expansion strategy', 2, true)
    `)
    console.log('✅ Tasks inserted')
    
    // Link customers to coach
    await pool.query(`
      INSERT INTO coach_customers (coach_id, customer_id) VALUES
        ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), (SELECT id FROM users WHERE email = 'customer1@example.com')),
        ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), (SELECT id FROM users WHERE email = 'customer2@example.com')),
        ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), (SELECT id FROM users WHERE email = 'customer3@example.com'))
    `)
    console.log('✅ Coach-customer links created')
    
    // Enroll customers in program
    await pool.query(`
      INSERT INTO user_programs (user_id, program_id, enrolled_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer1@example.com'), (SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), '2025-08-01 10:00:00'),
        ((SELECT id FROM users WHERE email = 'customer2@example.com'), (SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), '2025-08-15 14:00:00'),
        ((SELECT id FROM users WHERE email = 'customer3@example.com'), (SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), '2025-09-01 09:00:00')
    `)
    console.log('✅ Customer enrollments created')
    
    // Create sequential milestone progress
    console.log('📈 Creating sequential milestone progress...')
    
    // Jessica Lee's progress
    await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
         (SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1),
         '2025-08-01 10:00:00', true, '2025-08-31 15:00:00')
    `)
    
    await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
         (SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2),
         '2025-08-31 15:00:00', true, '2025-10-01 12:00:00')
    `)
    
    await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
         (SELECT id FROM milestones WHERE title = 'Chapter 10: Optimization' AND order_index = 3),
         '2025-10-01 12:00:00', true, '2025-10-25 16:00:00')
    `)
    
    await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
         (SELECT id FROM milestones WHERE title = 'Chapter 15: Expansion' AND order_index = 4),
         '2025-10-25 16:00:00', false, NULL)
    `)
    
    // Alex Thompson's progress
    await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer2@example.com'), 
         (SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1),
         '2025-08-15 14:00:00', true, '2025-09-14 11:00:00')
    `)
    
    await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer2@example.com'), 
         (SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2),
         '2025-09-14 11:00:00', true, '2025-10-20 14:00:00')
    `)
    
    await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer2@example.com'), 
         (SELECT id FROM milestones WHERE title = 'Chapter 10: Optimization' AND order_index = 3),
         '2025-10-20 14:00:00', false, NULL)
    `)
    
    // Sarah Wilson's progress
    await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer3@example.com'), 
         (SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1),
         '2025-09-01 09:00:00', false, NULL)
    `)
    
    console.log('✅ Sequential milestone progress created')
    
    // Insert some task progress
    await pool.query(`
      INSERT INTO task_progress (user_id, task_id, completed, completed_at) VALUES
        ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
         (SELECT id FROM tasks WHERE title = 'Market Research' AND order_index = 1), true, '2025-08-15 10:00:00'),
        ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
         (SELECT id FROM tasks WHERE title = 'Business Plan' AND order_index = 2), true, '2025-08-25 14:00:00'),
        ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
         (SELECT id FROM tasks WHERE title = 'Legal Setup' AND order_index = 3), true, '2025-08-31 15:00:00')
    `)
    console.log('✅ Task progress created')
    
    // Insert sample files
    await pool.query(`
      INSERT INTO task_files (task_id, milestone_id, user_id, file_name, original_name, file_path, file_size, file_type, uploaded_by) VALUES
        ((SELECT id FROM tasks WHERE title = 'Market Research' AND order_index = 1), 
         (SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1),
         (SELECT id FROM users WHERE email = 'customer1@example.com'),
         'market_research_2025_08_15.pdf', 'Market Research Report.pdf', '/uploads/1/1/1/market_research_2025_08_15.pdf', 2048576, 'application/pdf', 'Jessica Lee')
    `)
    console.log('✅ Sample files created')
    
    console.log('🎉 Database reset and population completed successfully!')
    
    // Verify the data
    const userCount = await pool.query('SELECT COUNT(*) FROM users')
    const coachCount = await pool.query('SELECT COUNT(*) FROM coaches')
    const programCount = await pool.query('SELECT COUNT(*) FROM coaching_programs')
    const milestoneCount = await pool.query('SELECT COUNT(*) FROM milestones')
    const customerCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = \'customer\'')
    
    console.log(`\n📊 Verification Results:`)
    console.log(`👥 Users: ${userCount.rows[0].count}`)
    console.log(`👨‍🏫 Coaches: ${coachCount.rows[0].count}`)
    console.log(`📚 Programs: ${programCount.rows[0].count}`)
    console.log(`🎯 Milestones: ${milestoneCount.rows[0].count}`)
    console.log(`👤 Customers: ${customerCount.rows[0].count}`)
    
    // Show Jessica Lee's milestone progress
    console.log('\n📈 Jessica Lee\'s Sequential Milestone Progress:')
    const jessicaProgress = await pool.query(`
      SELECT 
        m.title,
        mp.started_at,
        mp.completed_at,
        mp.completed,
        CASE 
          WHEN mp.completed = true THEN 
            EXTRACT(EPOCH FROM (mp.completed_at - mp.started_at)) / 86400
          ELSE NULL
        END as days_taken
      FROM milestone_progress mp
      JOIN milestones m ON mp.milestone_id = m.id
      JOIN users u ON mp.user_id = u.id
      WHERE u.email = 'customer1@example.com'
      ORDER BY m.order_index
    `)
    
    jessicaProgress.rows.forEach((row, index) => {
      const status = row.completed ? '✅ Completed' : '⏳ In Progress'
      const days = row.days_taken ? `(${Math.round(row.days_taken)} days)` : ''
      console.log(`  ${index + 1}. ${row.title}: ${status} ${days}`)
      console.log(`     Started: ${row.started_at}`)
      if (row.completed_at) {
        console.log(`     Completed: ${row.completed_at}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the reset
simpleReset()
