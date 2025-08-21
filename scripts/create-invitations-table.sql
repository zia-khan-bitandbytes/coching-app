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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_coach_id ON invitations(coach_id);
CREATE INDEX IF NOT EXISTS idx_invitations_program_id ON invitations(program_id);

-- Insert a test invitation to verify the table works
INSERT INTO invitations (token, coach_id, program_id, customer_email, customer_name, status, expires_at)
VALUES (
  'test-token-123',
  (SELECT id FROM coaches LIMIT 1),
  (SELECT id FROM coaching_programs LIMIT 1),
  'test@example.com',
  'Test User',
  'pending',
  (CURRENT_TIMESTAMP + INTERVAL '7 days')
) ON CONFLICT DO NOTHING;

SELECT 'Invitations table created successfully!' as result;
