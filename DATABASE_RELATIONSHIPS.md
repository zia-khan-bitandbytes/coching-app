# Database Relationships - Programs, Milestones, and Members

## Overview
The coaching application has been corrected to properly establish the hierarchical relationship between coaching programs, milestones, and members (customers).

## Database Schema Relationships

### 1. Programs → Milestones (One-to-Many)
- **Programs** belong to coaches (via `coach_id` in `coaching_programs` table)
- **Milestones** belong to programs (via `program_id` in `milestones` table)
- Each program can have multiple milestones
- Milestones are ordered within a program using `order_index`

```sql
-- Programs table
CREATE TABLE coaching_programs (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Milestones table
CREATE TABLE milestones (
  id SERIAL PRIMARY KEY,
  program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Members → Programs (Many-to-Many)
- **Members** (customers) can be enrolled in multiple programs
- **Programs** can have multiple enrolled members
- The relationship is managed through the `user_programs` table
- Each enrollment has a status (active, completed, paused, cancelled)

```sql
-- User programs table (enrollment relationship)
CREATE TABLE user_programs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  UNIQUE(user_id, program_id)
);
```

### 3. Members → Milestones (Progress Tracking)
- **Members** can track their progress through milestones
- **Milestone progress** is stored in the `milestone_progress` table
- Each member can have progress records for each milestone they're working on

```sql
-- Milestone progress table
CREATE TABLE milestone_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, milestone_id)
);
```

## API Endpoints

### Program Management
- `GET /api/coach/[coachId]/programs` - Get all programs for a coach
- `POST /api/coach/[coachId]/programs` - Create a new program

### Milestone Management
- `GET /api/coach/[coachId]/programs/[programId]/milestones` - Get milestones for a specific program
- `POST /api/coach/[coachId]/programs/[programId]/milestones` - Create a new milestone for a program

### Member Enrollment
- `POST /api/coach/[coachId]/programs/[programId]/enroll` - Enroll a member in a program
- `GET /api/coach/[coachId]/programs/[programId]/enroll` - Get all enrolled members for a program

### Progress Tracking
- `GET /api/customer/[customerId]/milestones` - Get all milestones for a customer
- `GET /api/customer/[customerId]/milestones/[milestoneId]/progress` - Get progress for a specific milestone
- `POST /api/customer/[customerId]/milestones/[milestoneId]/progress` - Update milestone progress

## Data Flow Example

1. **Coach creates a program** → `coaching_programs` table
2. **Coach adds milestones** → `milestones` table with `program_id` reference
3. **Customer enrolls in program** → `user_programs` table creates enrollment
4. **Customer works on milestones** → `milestone_progress` table tracks completion
5. **Progress is tracked** → Completion rates and analytics are calculated

## Key Benefits of This Structure

1. **Clear Hierarchy**: Programs contain milestones, members enroll in programs
2. **Flexible Enrollment**: Members can be in multiple programs simultaneously
3. **Progress Tracking**: Individual milestone completion is tracked per member
4. **Scalability**: Easy to add new programs, milestones, and track multiple members
5. **Data Integrity**: Foreign key constraints ensure data consistency

## Sample Queries

### Get all milestones for a program with completion rates
```sql
SELECT 
  m.id, m.title, m.description, m.order_index,
  COUNT(DISTINCT mp.user_id) as completed_count,
  COUNT(DISTINCT up.user_id) as total_enrolled,
  CASE 
    WHEN COUNT(DISTINCT up.user_id) > 0 THEN 
      ROUND((COUNT(DISTINCT mp.user_id)::float / COUNT(DISTINCT up.user_id)::float) * 100, 2)
    ELSE 0 
  END as completion_rate
FROM milestones m
LEFT JOIN user_programs up ON up.program_id = m.program_id AND up.status = 'active'
LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.completed = true
WHERE m.program_id = $1
GROUP BY m.id, m.title, m.description, m.order_index
ORDER BY m.order_index;
```

### Get customer's progress across all enrolled programs
```sql
SELECT 
  cp.name as program_name,
  COUNT(m.id) as total_milestones,
  COUNT(mp.milestone_id) as completed_milestones,
  ROUND((COUNT(mp.milestone_id)::float / COUNT(m.id)::float) * 100, 2) as progress_percentage
FROM user_programs up
JOIN coaching_programs cp ON up.program_id = cp.id
LEFT JOIN milestones m ON cp.id = m.program_id
LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = up.user_id AND mp.completed = true
WHERE up.user_id = $1 AND up.status = 'active'
GROUP BY cp.id, cp.name;
```

This structure ensures that the relationship between programs, milestones, and members is properly maintained and allows for comprehensive tracking and management of coaching programs. 