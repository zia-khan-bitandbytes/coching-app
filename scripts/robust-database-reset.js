const { Pool } = require('pg')

const pool = new Pool({
  user: 'bitandbytes',
  host: 'localhost',
  database: 'coaching_app',
  password: '1234',
  port: 5432,
})

async function robustDatabaseReset() {
  try {
    console.log('🗑️  Executing robust database reset...')
    
    // First, check what tables exist
    const existingTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    
    console.log('📋 Existing tables:', existingTables.rows.map(t => t.table_name))
    
    // Drop tables in correct order (respecting foreign key constraints)
    const tablesToDrop = [
      'task_files',
      'task_progress', 
      'milestone_progress',
      'user_programs',
      'tasks',
      'milestones',
      'coaching_programs',
      'coach_customers',
      'coaches',
      'users'
    ]
    
    for (const tableName of tablesToDrop) {
      if (existingTables.rows.some(t => t.table_name === tableName)) {
        try {
          console.log(`🗑️  Dropping table: ${tableName}`)
          await pool.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`)
          console.log(`✅ Dropped table: ${tableName}`)
        } catch (error) {
          console.log(`⚠️  Could not drop ${tableName}:`, error.message)
        }
      } else {
        console.log(`ℹ️  Table ${tableName} does not exist, skipping`)
      }
    }
    
    console.log('\n🔨 Creating new tables...')
    
    // Create tables in correct order
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created users table')
    
    await pool.query(`
      CREATE TABLE coaches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created coaches table')
    
    await pool.query(`
      CREATE TABLE coach_customers (
        id SERIAL PRIMARY KEY,
        coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(coach_id, customer_id)
      )
    `)
    console.log('✅ Created coach_customers table')
    
    await pool.query(`
      CREATE TABLE coaching_programs (
        id SERIAL PRIMARY KEY,
        coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        duration_days INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created coaching_programs table')
    
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
    console.log('✅ Created milestones table')
    
    await pool.query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL,
        requires_upload BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created tasks table')
    
    await pool.query(`
      CREATE TABLE user_programs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, program_id)
      )
    `)
    console.log('✅ Created user_programs table')
    
    await pool.query(`
      CREATE TABLE milestone_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        completed BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, milestone_id)
      )
    `)
    console.log('✅ Created milestone_progress table')
    
    await pool.query(`
      CREATE TABLE task_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, task_id)
      )
    `)
    console.log('✅ Created task_progress table')
    
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
        uploaded_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created task_files table')
    
    // Create indexes
    console.log('\n🔧 Creating indexes...')
    await pool.query('CREATE INDEX idx_users_email ON users(email)')
    await pool.query('CREATE INDEX idx_coaches_user_id ON coaches(user_id)')
    await pool.query('CREATE INDEX idx_milestones_program_order ON milestones(program_id, order_index)')
    await pool.query('CREATE INDEX idx_tasks_milestone_order ON tasks(milestone_id, order_index)')
    await pool.query('CREATE INDEX idx_user_programs_user ON user_programs(user_id)')
    await pool.query('CREATE INDEX idx_milestone_progress_user ON milestone_progress(user_id)')
    await pool.query('CREATE INDEX idx_task_progress_user ON task_progress(user_id)')
    await pool.query('CREATE INDEX idx_task_files_user_task ON task_files(user_id, task_id)')
    console.log('✅ All indexes created')
    
    // Insert test data
    console.log('\n📝 Inserting test data...')
    
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Coach John', 'coach1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach'),
      ('Customer Jessica', 'customer1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer'),
      ('Customer Alex', 'customer2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer')
    `)
    console.log('✅ Inserted users')
    
    await pool.query(`
      INSERT INTO coaches (user_id, business_name, specialization, bio) VALUES
      (1, 'Startup Success Academy', 'Business Strategy & Growth', 'Expert in helping startups scale and succeed')
    `)
    console.log('✅ Inserted coaches')
    
    await pool.query(`
      INSERT INTO coach_customers (coach_id, customer_id) VALUES
      (1, 2), (1, 3)
    `)
    console.log('✅ Inserted coach-customer relationships')
    
    await pool.query(`
      INSERT INTO coaching_programs (coach_id, title, description, price, duration_days) VALUES
      (1, 'Startup Success Blueprint', 'Complete guide to launching and scaling your startup', 2500.00, 120)
    `)
    console.log('✅ Inserted coaching programs')
    
    await pool.query(`
      INSERT INTO milestones (program_id, title, description, order_index, goal_days) VALUES
      (1, 'CHAPTER 1: Foundation', 'Build your business foundation and validate your idea', 1, 30),
      (1, 'CHAPTER 2: Growth', 'Scale your operations and customer base', 2, 30),
      (1, 'CHAPTER 3: Optimization', 'Optimize processes and maximize efficiency', 3, 30),
      (1, 'CHAPTER 4: Expansion', 'Expand to new markets and opportunities', 4, 30)
    `)
    console.log('✅ Inserted milestones')
    
    await pool.query(`
      INSERT INTO tasks (milestone_id, title, description, order_index, requires_upload) VALUES
      (1, 'Market Research', 'Conduct comprehensive market research', 1, true),
      (1, 'Business Plan', 'Create detailed business plan', 2, true),
      (1, 'Legal Setup', 'Set up business legal structure', 3, false),
      (2, 'Customer Acquisition', 'Develop customer acquisition strategy', 1, true),
      (2, 'Process Scaling', 'Scale operational processes', 2, true),
      (2, 'Team Building', 'Build and manage your team', 3, false),
      (3, 'Performance Review', 'Review and optimize performance', 1, true),
      (3, 'Efficiency Audit', 'Audit and improve efficiency', 2, true),
      (4, 'Market Analysis', 'Analyze new market opportunities', 1, true),
      (4, 'Expansion Plan', 'Create expansion strategy', 2, true)
    `)
    console.log('✅ Inserted tasks')
    
    await pool.query(`
      INSERT INTO user_programs (user_id, program_id, enrolled_at) VALUES
      (2, 1, '2025-08-21 10:00:00'),
      (3, 1, '2025-08-21 10:00:00')
    `)
    console.log('✅ Enrolled customers in programs')
    
    // Create milestone progress records (initially NOT started)
    await pool.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed_at, completed) VALUES
      (2, 1, '2025-08-21 10:00:00', NULL, false),
      (2, 2, NULL, NULL, false),
      (2, 3, NULL, NULL, false),
      (2, 4, NULL, NULL, false),
      (3, 1, NULL, NULL, false),
      (3, 2, NULL, NULL, false),
      (3, 3, NULL, NULL, false),
      (3, 4, NULL, NULL, false)
    `)
    console.log('✅ Created milestone progress records')
    
    // Create some task progress for demonstration
    await pool.query(`
      INSERT INTO task_progress (user_id, task_id, completed, completed_at) VALUES
      (2, 1, true, '2025-08-25 14:00:00'),
      (2, 2, false, NULL),
      (2, 3, true, '2025-08-28 16:00:00')
    `)
    console.log('✅ Created task progress records')
    
    // Add sample file for completed task
    await pool.query(`
      INSERT INTO task_files (task_id, milestone_id, user_id, file_name, original_name, file_path, file_size, file_type, uploaded_by) VALUES
      (1, 1, 2, 'market_research_2025_08_25.pdf', 'Market Research Report.pdf', '/uploads/1/1/1/market_research_2025_08_25.pdf', 2048576, 'application/pdf', 'Customer Jessica')
    `)
    console.log('✅ Created sample file record')
    
    console.log('\n🎉 Complete database reset finished successfully!')
    console.log('\n📊 New test data created:')
    console.log('  👨‍🏫 Coach: coach1@example.com (password: password123)')
    console.log('  👩‍💼 Customer Jessica: customer1@example.com (password: password123)')
    console.log('  👨‍💼 Customer Alex: customer2@example.com (password: password123)')
    
    // Verify the new structure
    console.log('\n🔍 Verifying new database structure...')
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users')
    const milestoneCount = await pool.query('SELECT COUNT(*) FROM milestones')
    const taskCount = await pool.query('SELECT COUNT(*) FROM tasks')
    
    console.log(`  Users: ${userCount.rows[0].count}`)
    console.log(`  Milestones: ${milestoneCount.rows[0].count}`)
    console.log(`  Tasks: ${taskCount.rows[0].count}`)
    
    // Check milestone progress for Jessica
    const jessicaProgress = await pool.query(`
      SELECT 
        m.title,
        mp.started_at,
        mp.completed,
        mp.completed_at
      FROM milestone_progress mp
      JOIN milestones m ON mp.milestone_id = m.id
      WHERE mp.user_id = 2
      ORDER BY m.order_index
    `)
    
    console.log('\n📋 Jessica\'s milestone progress:')
    jessicaProgress.rows.forEach(row => {
      const status = row.completed ? '✅ Completed' : 
                   row.started_at ? '🟡 In Progress' : '🟠 Ready to Start'
      console.log(`  ${row.title}: ${status}`)
    })
    
    console.log('\n🔒 Sequential milestone logic implemented:')
    console.log('  • Milestone 1: Started but not completed (can be completed)')
    console.log('  • Milestone 2: NOT started (locked until Milestone 1 completes)')
    console.log('  • Milestone 3: NOT started (locked until Milestone 2 completes)')
    console.log('  • Milestone 4: NOT started (locked until Milestone 3 completes)')
    
  } catch (error) {
    console.error('❌ Error during complete reset:', error)
  } finally {
    await pool.end()
  }
}

robustDatabaseReset()
