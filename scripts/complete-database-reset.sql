-- Complete Database Reset with Sequential Milestone Progression
-- This script drops all test data and recreates it with proper milestone unlocking logic

-- Drop all existing data
DROP TABLE IF EXISTS task_files CASCADE;
DROP TABLE IF EXISTS task_progress CASCADE;
DROP TABLE IF EXISTS milestone_progress CASCADE;
DROP TABLE IF EXISTS user_programs CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS coaching_programs CASCADE;
DROP TABLE IF EXISTS coach_customers CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate tables with proper structure
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coaches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coach_customers (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coach_id, customer_id)
);

CREATE TABLE coaching_programs (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    requires_upload BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_programs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, program_id)
);

CREATE TABLE milestone_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
    started_at TIMESTAMP NULL, -- NULL until milestone is manually started
    completed_at TIMESTAMP NULL,
    completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, milestone_id)
);

CREATE TABLE task_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP NULL,
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
    uploaded_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_coaches_user_id ON coaches(user_id);
CREATE INDEX idx_milestones_program_order ON milestones(program_id, order_index);
CREATE INDEX idx_tasks_milestone_order ON tasks(milestone_id, order_index);
CREATE INDEX idx_user_programs_user ON user_programs(user_id);
CREATE INDEX idx_milestone_progress_user ON milestone_progress(user_id);
CREATE INDEX idx_task_progress_user ON task_progress(user_id);
CREATE INDEX idx_task_files_user_task ON task_files(user_id, task_id);

-- Insert test data with proper sequential logic
INSERT INTO users (name, email, password_hash, role) VALUES
('Coach John', 'coach1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'coach'),
('Customer Jessica', 'customer1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer'),
('Customer Alex', 'customer2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer');

INSERT INTO coaches (user_id, business_name, specialization, bio) VALUES
(1, 'Startup Success Academy', 'Business Strategy & Growth', 'Expert in helping startups scale and succeed');

INSERT INTO coach_customers (coach_id, customer_id) VALUES
(1, 2), (1, 3);

INSERT INTO coaching_programs (coach_id, title, description, price, duration_days) VALUES
(1, 'Startup Success Blueprint', 'Complete guide to launching and scaling your startup', 2500.00, 120);

INSERT INTO milestones (program_id, title, description, order_index, goal_days) VALUES
(1, 'CHAPTER 1: Foundation', 'Build your business foundation and validate your idea', 1, 30),
(1, 'CHAPTER 2: Growth', 'Scale your operations and customer base', 2, 30),
(1, 'CHAPTER 3: Optimization', 'Optimize processes and maximize efficiency', 3, 30),
(1, 'CHAPTER 4: Expansion', 'Expand to new markets and opportunities', 4, 30);

INSERT INTO tasks (milestone_id, title, description, order_index, requires_upload) VALUES
-- Foundation tasks
(1, 'Market Research', 'Conduct comprehensive market research', 1, true),
(1, 'Business Plan', 'Create detailed business plan', 2, true),
(1, 'Legal Setup', 'Set up business legal structure', 3, false),

-- Growth tasks
(2, 'Customer Acquisition', 'Develop customer acquisition strategy', 1, true),
(2, 'Process Scaling', 'Scale operational processes', 2, true),
(2, 'Team Building', 'Build and manage your team', 3, false),

-- Optimization tasks
(3, 'Performance Review', 'Review and optimize performance', 1, true),
(3, 'Efficiency Audit', 'Audit and improve efficiency', 2, true),

-- Expansion tasks
(4, 'Market Analysis', 'Analyze new market opportunities', 1, true),
(4, 'Expansion Plan', 'Create expansion strategy', 2, true);

-- Enroll customers in program
INSERT INTO user_programs (user_id, program_id, enrolled_at) VALUES
(2, 1, '2025-08-21 10:00:00'),
(3, 1, '2025-08-21 10:00:00');

-- Create milestone progress records (initially NOT started)
INSERT INTO milestone_progress (user_id, milestone_id, started_at, completed_at, completed) VALUES
-- Customer Jessica - only first milestone started
(2, 1, '2025-08-21 10:00:00', NULL, false), -- Started but not completed
(2, 2, NULL, NULL, false), -- NOT started (locked until milestone 1 completes)
(2, 3, NULL, NULL, false), -- NOT started (locked until milestone 2 completes)
(2, 4, NULL, NULL, false), -- NOT started (locked until milestone 3 completes)

-- Customer Alex - no milestones started
(3, 1, NULL, NULL, false), -- NOT started
(3, 2, NULL, NULL, false), -- NOT started
(3, 3, NULL, NULL, false), -- NOT started
(3, 4, NULL, NULL, false); -- NOT started

-- Create some task progress for demonstration
INSERT INTO task_progress (user_id, task_id, completed, completed_at) VALUES
-- Jessica has completed some tasks in milestone 1
(2, 1, true, '2025-08-25 14:00:00'), -- Market Research completed
(2, 2, false, NULL), -- Business Plan not completed
(2, 3, true, '2025-08-28 16:00:00'); -- Legal Setup completed

-- Add some sample files for completed tasks
INSERT INTO task_files (task_id, milestone_id, user_id, file_name, original_name, file_path, file_size, file_type, uploaded_by) VALUES
(1, 1, 2, 'market_research_2025_08_25.pdf', 'Market Research Report.pdf', '/uploads/1/1/1/market_research_2025_08_25.pdf', 2048576, 'application/pdf', 'Customer Jessica');
