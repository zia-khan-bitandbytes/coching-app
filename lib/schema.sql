-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('coach', 'customer', 'super_admin')),
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

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  coach_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  program_id INTEGER REFERENCES programs(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_programs table (for customer enrollments)
CREATE TABLE IF NOT EXISTS user_programs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  program_id INTEGER REFERENCES programs(id),
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, program_id)
);

-- Create milestone_progress table
CREATE TABLE IF NOT EXISTS milestone_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  milestone_id INTEGER REFERENCES milestones(id),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, milestone_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  program_id INTEGER REFERENCES programs(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_programs_user_id ON user_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_programs_program_id ON user_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_milestones_program_id ON milestones(program_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_milestone_id ON user_milestones(milestone_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_program_id ON payments(program_id);

-- Insert default coaching programs
INSERT INTO coaching_programs (name, description, duration_weeks, price) VALUES
  ('Business Growth Program', 'Accelerate your business growth with proven strategies and expert guidance', 12, 2999.00),
  ('Leadership Mastery', 'Develop essential leadership skills to inspire and lead your team effectively', 8, 1999.00),
  ('Sales Excellence', 'Master the art of sales and increase your revenue with proven techniques', 10, 2499.00)
ON CONFLICT DO NOTHING;

-- Insert default milestones for Business Growth Program
INSERT INTO milestones (program_id, title, description, order_index) 
SELECT 
  cp.id,
  m.title,
  m.description,
  m.order_index
FROM coaching_programs cp
CROSS JOIN (VALUES
  ('Business Assessment', 'Complete comprehensive business analysis and identify growth opportunities', 1),
  ('Goal Setting', 'Define clear, measurable business goals and create action plans', 2),
  ('Market Research', 'Conduct thorough market research and competitive analysis', 3),
  ('Strategy Development', 'Develop comprehensive business growth strategies', 4),
  ('Implementation Planning', 'Create detailed implementation plans with timelines and resources', 5),
  ('Team Building', 'Build and train high-performing teams', 6),
  ('Marketing Strategy', 'Develop effective marketing and branding strategies', 7),
  ('Financial Planning', 'Create robust financial plans and funding strategies', 8),
  ('Process Optimization', 'Optimize business processes for efficiency and scalability', 9),
  ('Growth Metrics', 'Establish KPIs and tracking systems for business growth', 10),
  ('Risk Management', 'Identify and mitigate potential business risks', 11),
  ('Scaling Strategy', 'Develop strategies for sustainable business scaling', 12)
) AS m(title, description, order_index)
WHERE cp.name = 'Business Growth Program'
ON CONFLICT DO NOTHING; 