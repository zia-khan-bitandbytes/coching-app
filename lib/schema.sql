-- Create users table first (no dependencies)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('coach', 'customer', 'super_admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create coaches table (extends users table)
CREATE TABLE IF NOT EXISTS coaches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  bio TEXT,
  specialization VARCHAR(255),
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create coaching_programs table with coach ownership
CREATE TABLE IF NOT EXISTS coaching_programs (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reset_tokens table
CREATE TABLE IF NOT EXISTS reset_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create milestones table with program ownership
CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  goal_days INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table for milestone tasks
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  requires_upload BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Create user_programs table (for customer enrollments in coach programs)
CREATE TABLE IF NOT EXISTS user_programs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  UNIQUE(user_id, program_id)
);

-- Create milestone_progress table
CREATE TABLE IF NOT EXISTS milestone_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, milestone_id)
);

-- Create task_progress table for tracking individual customer task completion
CREATE TABLE IF NOT EXISTS task_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, task_id)
);

-- Create payments table with coach ownership
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table for community chat (coach-specific)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  parent_id INTEGER REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create message_reactions table for storing reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

-- Create coach_customers table for linking coaches to their customers
CREATE TABLE IF NOT EXISTS coach_customers (
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (coach_id, customer_id)
);

-- Create invitations table for tracking program invitations
CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

-- Create indexes after all tables are created
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_programs_coach_id ON coaching_programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_user_programs_user_id ON user_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_programs_program_id ON user_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_milestones_program_id ON milestones(program_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_progress_user_id ON milestone_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_progress_milestone_id ON milestone_progress(milestone_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_user_id ON task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_program_id ON payments(program_id);
CREATE INDEX IF NOT EXISTS idx_messages_coach_id ON messages(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_customers_coach_id ON coach_customers(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_customers_customer_id ON coach_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_coach_id ON invitations(coach_id);
CREATE INDEX IF NOT EXISTS idx_invitations_program_id ON invitations(program_id);

-- Add task_files table for storing uploaded files
CREATE TABLE IF NOT EXISTS task_files (
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

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_milestone_id ON task_files(milestone_id);
CREATE INDEX IF NOT EXISTS idx_task_files_user_id ON task_files(user_id);

-- Insert sample super admin user
INSERT INTO users (email, name, password, role) VALUES
  ('admin@coachingapp.com', 'Super Admin', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'super_admin')
ON CONFLICT DO NOTHING;

-- Insert sample coaches
INSERT INTO users (email, name, password, role) VALUES
  ('coach1@example.com', 'John Smith', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'coach'),
  ('coach2@example.com', 'Sarah Johnson', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'coach'),
  ('coach3@example.com', 'Mike Chen', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'coach')
ON CONFLICT DO NOTHING;

-- Insert coach profiles
INSERT INTO coaches (user_id, business_name, bio, specialization, hourly_rate) VALUES
  ((SELECT id FROM users WHERE email = 'coach1@example.com'), 'Business Growth Academy', 'Expert in scaling businesses from startup to enterprise', 'Business Strategy & Growth', 150.00),
  ((SELECT id FROM users WHERE email = 'coach2@example.com'), 'Leadership Excellence', 'Helping leaders develop their full potential', 'Leadership Development', 200.00),
  ((SELECT id FROM users WHERE email = 'coach3@example.com'), 'Sales Mastery Institute', 'Transforming sales professionals into top performers', 'Sales & Revenue Growth', 175.00)
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO users (email, name, password, role) VALUES
  ('customer1@example.com', 'Emma Davis', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer'),
  ('customer2@example.com', 'Alex Thompson', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer'),
  ('customer3@example.com', 'Lisa Wang', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer'),
  ('customer4@example.com', 'David Brown', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer'),
  ('customer5@example.com', 'Maria Garcia', '$2b$10$rQJ8N7vK9mX2pL3qR5tY8uI1oP9aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ', 'customer')
ON CONFLICT DO NOTHING;

-- Insert coach programs
INSERT INTO coaching_programs (coach_id, name, description, price) VALUES
  ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), 'Startup to Scale', 'Complete guide to scaling your startup from 0 to 1000 customers', 2999.00),
  ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), 'Revenue Optimization', 'Maximize your business revenue through strategic optimization', 1999.00),
  ((SELECT id FROM coaches WHERE business_name = 'Leadership Excellence'), 'Executive Leadership', 'Develop executive-level leadership skills for C-suite positions', 3499.00),
  ((SELECT id FROM coaches WHERE business_name = 'Leadership Excellence'), 'Team Management', 'Master the art of building and managing high-performing teams', 1499.00),
  ((SELECT id FROM coaches WHERE business_name = 'Sales Mastery Institute'), 'B2B Sales Mastery', 'Dominate B2B sales with proven strategies and techniques', 3999.00),
  ((SELECT id FROM coaches WHERE business_name = 'Sales Mastery Institute'), 'Sales Team Training', 'Train your sales team to achieve consistent results', 2499.00)
ON CONFLICT DO NOTHING;

-- Insert milestones for programs
INSERT INTO milestones (program_id, title, description, order_index) VALUES
  -- Startup to Scale milestones
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale'), 'Market Validation', 'Validate your product-market fit through customer research', 1),
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale'), 'MVP Development', 'Build and launch your minimum viable product', 2),
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale'), 'Customer Acquisition', 'Implement customer acquisition strategies', 3),
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale'), 'Scaling Operations', 'Scale your operations to handle growth', 4),
  
  -- Executive Leadership milestones
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Executive Leadership'), 'Strategic Thinking', 'Develop strategic thinking and planning skills', 1),
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Executive Leadership'), 'Decision Making', 'Master executive decision-making frameworks', 2),
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Executive Leadership'), 'Stakeholder Management', 'Learn to manage complex stakeholder relationships', 3),
  
  -- B2B Sales Mastery milestones
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'B2B Sales Mastery'), 'Prospecting Mastery', 'Master B2B prospecting techniques', 1),
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'B2B Sales Mastery'), 'Discovery Process', 'Perfect your sales discovery process', 2),
  ((SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'B2B Sales Mastery'), 'Solution Selling', 'Learn solution-based selling approaches', 3)
ON CONFLICT DO NOTHING;

-- Assign customers to coaches
INSERT INTO coach_customers (coach_id, customer_id) VALUES
  ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), (SELECT id FROM users WHERE email = 'customer1@example.com')),
  ((SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'), (SELECT id FROM users WHERE email = 'customer2@example.com')),
  ((SELECT id FROM coaches WHERE business_name = 'Leadership Excellence'), (SELECT id FROM users WHERE email = 'customer3@example.com')),
  ((SELECT id FROM coaches WHERE business_name = 'Leadership Excellence'), (SELECT id FROM users WHERE email = 'customer4@example.com')),
  ((SELECT id FROM coaches WHERE business_name = 'Sales Mastery Institute'), (SELECT id FROM users WHERE email = 'customer5@example.com'))
ON CONFLICT DO NOTHING;

-- Enroll customers in programs
INSERT INTO user_programs (user_id, program_id) VALUES
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale')),
  ((SELECT id FROM users WHERE email = 'customer2@example.com'), (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Revenue Optimization')),
  ((SELECT id FROM users WHERE email = 'customer3@example.com'), (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Executive Leadership')),
  ((SELECT id FROM users WHERE email = 'customer4@example.com'), (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Team Management')),
  ((SELECT id FROM users WHERE email = 'customer5@example.com'), (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'B2B Sales Mastery'))
ON CONFLICT DO NOTHING;

-- Add some milestone progress
INSERT INTO milestone_progress (user_id, milestone_id, completed, completed_at) VALUES
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id WHERE cp.name = 'Startup to Scale' AND m.title = 'Market Validation'), TRUE, NOW()),
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id WHERE cp.name = 'Startup to Scale' AND m.title = 'MVP Development'), TRUE, NOW()),
  ((SELECT id FROM users WHERE email = 'customer3@example.com'), (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id WHERE cp.name = 'Executive Leadership' AND m.title = 'Strategic Thinking'), TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Add sample payments
INSERT INTO payments (user_id, program_id, amount, status) VALUES
  ((SELECT id FROM users WHERE email = 'customer1@example.com'), (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale'), 2999.00, 'completed'),
  ((SELECT id FROM users WHERE email = 'customer2@example.com'), (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Revenue Optimization'), 1999.00, 'completed'),
  ((SELECT id FROM users WHERE email = 'customer3@example.com'), (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Executive Leadership'), 3499.00, 'completed')
ON CONFLICT DO NOTHING; 