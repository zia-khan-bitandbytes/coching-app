-- Migration script to add duration_days field to coaching_programs table
-- This supports one-time payment with monthly tracking

-- Add duration_days column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaching_programs' 
        AND column_name = 'duration_days'
    ) THEN
        ALTER TABLE coaching_programs ADD COLUMN duration_days INTEGER DEFAULT 30;
        RAISE NOTICE 'Added duration_days column to coaching_programs table';
    ELSE
        RAISE NOTICE 'duration_days column already exists in coaching_programs table';
    END IF;
END $$;

-- Update existing programs with calculated duration based on milestone goals
-- This calculates the total duration from milestone goal_days
UPDATE coaching_programs 
SET duration_days = (
    SELECT COALESCE(SUM(m.goal_days), 30)
    FROM milestones m 
    WHERE m.program_id = coaching_programs.id
)
WHERE duration_days = 30 OR duration_days IS NULL;

-- Set a minimum duration for programs without milestones
UPDATE coaching_programs 
SET duration_days = 30 
WHERE duration_days IS NULL OR duration_days < 1;

-- Display the results
SELECT 
    id,
    name,
    price,
    duration_days,
    CASE 
        WHEN duration_days > 0 THEN 
            ROUND((price * 1.0) / (duration_days * 1.0 / 30), 2)
        ELSE 0 
    END as calculated_monthly_revenue
FROM coaching_programs 
ORDER BY id;
