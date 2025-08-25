-- Reset and Populate Database with Sequential Milestone System
-- This script creates a clean database with sequential milestone unlocking

-- Drop all tables to start fresh (with CASCADE to handle dependencies)
DROP TABLE IF EXISTS task_files CASCADE;
DROP TABLE IF EXISTS task_progress CASCADE;
DROP TABLE IF EXISTS milestone_progress CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS user_programs CASCADE;
DROP TABLE IF EXISTS coaching_programs CASCADE;
DROP TABLE IF EXISTS coach_customers CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate tables with updated schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'coach', 'customer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coaches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  bio TEXT,
  specialization VARCHAR(255),
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coaching_programs (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_programs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  UNIQUE(user_id, program_id)
);

CREATE TABLE milestones (
  id SERIAL PRIMARY KEY,
  program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  goal_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Updated milestone_progress table with started_at field
CREATE TABLE milestone_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP, -- When milestone was unlocked (previous milestone completed)
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, milestone_id)
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  requires_upload BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, task_id)
);

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
);

CREATE TABLE coach_customers (
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (coach_id, customer_id)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_coaches_user_id ON coaches(user_id);
CREATE INDEX idx_coaching_programs_coach_id ON coaching_programs(coach_id);
CREATE INDEX idx_user_programs_user_id ON user_programs(user_id);
CREATE INDEX idx_user_programs_program_id ON user_programs(program_id);
CREATE INDEX idx_milestones_program_id ON milestones(program_id);
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX idx_milestone_progress_user_id ON milestone_progress(user_id);
CREATE INDEX idx_milestone_progress_milestone_id ON milestone_progress(milestone_id);
CREATE INDEX idx_task_progress_user_id ON task_progress(user_id);
CREATE INDEX idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX idx_task_files_task_id ON task_files(task_id);
CREATE INDEX idx_coach_customers_coach_id ON coach_customers(coach_id);

-- Insert test data

-- 1. Create users
INSERT INTO users (email, name, password, role) VALUES
  ('admin@coachingapp.com', 'Super Admin', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'super_admin'),
  ('coach1@example.com', 'John Smith', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'coach'),
  ('customer1@example.com', 'Jessica Lee', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer'),
  ('customer2@example.com', 'Alex Thompson', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer'),
  ('customer3@example.com', 'Sarah Wilson', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer');

-- 2. Create coach
INSERT INTO coaches (user_id, business_name, bio, specialization, hourly_rate) VALUES
  ((SELECT id FROM users WHERE email = 'coach1@example.com'), 'Business Growth Academy', 'Expert in scaling businesses from startup to enterprise', 'Business Strategy & Growth', 150.00);

-- 3. Create program
INSERT INTO coaching_programs (coach_id, name, description, price, duration_days) VALUES
  ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), 'Startup Success Blueprint', 'Complete guide to launching and scaling your startup', 2999.00, 120);

-- 4. Create milestones (sequential order)
INSERT INTO milestones (program_id, title, description, order_index, goal_days) VALUES
  ((SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), 'CHAPTER 1: Foundation', 'Build your business foundation and validate your idea', 1, 30),
  ((SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), 'Chapter 5: Growth', 'Scale your operations and customer base', 2, 30),
  ((SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), 'Chapter 10: Optimization', 'Optimize processes and maximize efficiency', 3, 30),
  ((SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), 'Chapter 15: Expansion', 'Expand to new markets and opportunities', 4, 30);

-- 5. Create tasks for each milestone
INSERT INTO tasks (milestone_id, title, description, order_index, requires_upload) VALUES
  -- Chapter 1 tasks
  ((SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1), 'Market Research', 'Conduct comprehensive market research', 1, true),
  ((SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1), 'Business Plan', 'Create detailed business plan', 2, true),
  ((SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1), 'Legal Setup', 'Set up business legal structure', 3, false),
  
  -- Chapter 5 tasks
  ((SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2), 'Customer Acquisition', 'Implement customer acquisition strategy', 1, true),
  ((SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2), 'Team Building', 'Build and train your team', 2, false),
  ((SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2), 'Process Optimization', 'Optimize business processes', 3, true),
  
  -- Chapter 10 tasks
  ((SELECT id FROM milestones WHERE title = 'Chapter 10: Optimization' AND order_index = 3), 'Performance Review', 'Review and analyze performance metrics', 1, true),
  ((SELECT id FROM milestones WHERE title = 'Chapter 10: Optimization' AND order_index = 3), 'Efficiency Audit', 'Conduct efficiency audit', 2, true),
  
  -- Chapter 15 tasks
  ((SELECT id FROM milestones WHERE title = 'Chapter 15: Expansion' AND order_index = 4), 'Market Analysis', 'Analyze new market opportunities', 1, true),
  ((SELECT id FROM milestones WHERE title = 'Chapter 15: Expansion' AND order_index = 4), 'Expansion Plan', 'Create expansion strategy', 2, true);

-- 6. Link customers to coach
INSERT INTO coach_customers (coach_id, customer_id) VALUES
  ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), (SELECT id FROM users WHERE email = 'customer1@example.com')),
  ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), (SELECT id FROM users WHERE email = 'customer2@example.com')),
  ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), (SELECT id FROM users WHERE email = 'customer3@example.com'));

-- 7. Enroll customers in program
INSERT INTO user_programs (user_id, program_id, enrolled_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), (SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), '2025-08-01 10:00:00'),
  ((SELECT id FROM users WHERE email = 'customer2@example.com'), (SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), '2025-08-15 14:00:00'),
  ((SELECT id FROM users WHERE email = 'customer3@example.com'), (SELECT id FROM coaching_programs WHERE name = 'Startup Success Blueprint'), '2025-09-01 09:00:00');

-- 8. Create sequential milestone progress with realistic timeline
-- Customer 1: Jessica Lee - Sequential completion with proper unlock dates

-- Milestone 1: Started immediately after enrollment (Aug 1), completed Aug 31 (30 days)
INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
   (SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1),
   '2025-08-01 10:00:00', true, '2025-08-31 15:00:00');

-- Milestone 2: Started when Milestone 1 was completed (Aug 31), completed Oct 1 (32 days)
INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
   (SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2),
   '2025-08-31 15:00:00', true, '2025-10-01 12:00:00');

-- Milestone 3: Started when Milestone 2 was completed (Oct 1), completed Oct 25 (24 days)
INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
   (SELECT id FROM milestones WHERE title = 'Chapter 10: Optimization' AND order_index = 3),
   '2025-10-01 12:00:00', true, '2025-10-25 16:00:00');

-- Milestone 4: Started when Milestone 3 was completed (Oct 25), still in progress
INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
   (SELECT id FROM milestones WHERE title = 'Chapter 15: Expansion' AND order_index = 4),
   '2025-10-25 16:00:00', false, NULL);

-- Customer 2: Alex Thompson - Different completion pattern
-- Milestone 1: Started Aug 15, completed Sep 14 (30 days)
INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer2@example.com'), 
   (SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1),
   '2025-08-15 14:00:00', true, '2025-09-14 11:00:00');

-- Milestone 2: Started Sep 14, completed Oct 20 (36 days)
INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer2@example.com'), 
   (SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2),
   '2025-09-14 11:00:00', true, '2025-10-20 14:00:00');

-- Milestone 3: Started Oct 20, still in progress
INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer2@example.com'), 
   (SELECT id FROM milestones WHERE title = 'Chapter 10: Optimization' AND order_index = 3),
   '2025-10-20 14:00:00', false, NULL);

-- Customer 3: Sarah Wilson - Just started
-- Milestone 1: Started Sep 1, still in progress
INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer3@example.com'), 
   (SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1),
   '2025-09-01 09:00:00', false, NULL);

-- 9. Create some task progress and files for testing
-- Customer 1 completed tasks
INSERT INTO task_progress (user_id, task_id, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
   (SELECT id FROM tasks WHERE title = 'Market Research' AND order_index = 1), true, '2025-08-15 10:00:00'),
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
   (SELECT id FROM tasks WHERE title = 'Business Plan' AND order_index = 2), true, '2025-08-25 14:00:00'),
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), 
   (SELECT id FROM tasks WHERE title = 'Legal Setup' AND order_index = 3), true, '2025-08-31 15:00:00');

-- Customer 2 completed some tasks
INSERT INTO task_progress (user_id, task_id, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer2@example.com'), 
   (SELECT id FROM tasks WHERE title = 'Market Research' AND order_index = 1), true, '2025-08-25 16:00:00'),
  ((SELECT id FROM users WHERE email = 'customer2@example.com'), 
   (SELECT id FROM tasks WHERE title = 'Business Plan' AND order_index = 2), true, '2025-09-10 12:00:00');

-- 10. Create some sample files
INSERT INTO task_files (task_id, milestone_id, user_id, file_name, original_name, file_path, file_size, file_type, uploaded_by) VALUES
  ((SELECT id FROM tasks WHERE title = 'Market Research' AND order_index = 1), 
   (SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1),
   (SELECT id FROM users WHERE email = 'customer1@example.com'),
   'market_research_2025_08_15.pdf', 'Market Research Report.pdf', '/uploads/1/1/1/market_research_2025_08_15.pdf', 2048576, 'application/pdf', 'Jessica Lee'),
   
  ((SELECT id FROM tasks WHERE title = 'Business Plan' AND order_index = 2), 
   (SELECT id FROM milestones WHERE title = 'CHAPTER 1: Foundation' AND order_index = 1),
   (SELECT id FROM users WHERE email = 'customer1@example.com'),
   'business_plan_2025_08_25.docx', 'Business Plan.docx', '/uploads/1/1/2/business_plan_2025_08_25.docx', 1536000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Jessica Lee'),
   
  ((SELECT id FROM tasks WHERE title = 'Customer Acquisition' AND order_index = 1), 
   (SELECT id FROM milestones WHERE title = 'Chapter 5: Growth' AND order_index = 2),
   (SELECT id FROM users WHERE email = 'customer1@example.com'),
   'customer_acquisition_strategy.pdf', 'Customer Acquisition Strategy.pdf', '/uploads/1/2/1/customer_acquisition_strategy.pdf', 3072000, 'application/pdf', 'Jessica Lee');

-- Display the created data
SELECT 'Database reset and populated successfully!' as status;
