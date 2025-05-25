-- Add checklist_responses column if it doesn't exist
DO $$ 
BEGIN
    -- Add checklist_responses column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'checklist_responses') THEN
        ALTER TABLE assessments ADD COLUMN checklist_responses JSONB NOT NULL DEFAULT '{}';
    END IF;
END $$;

-- Update the assessments table structure to ensure all columns exist
DO $$ 
BEGIN
    -- Add total_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'total_score') THEN
        ALTER TABLE assessments ADD COLUMN total_score INTEGER DEFAULT 0;
    END IF;
    
    -- Add max_possible_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'max_possible_score') THEN
        ALTER TABLE assessments ADD COLUMN max_possible_score INTEGER DEFAULT 0;
    END IF;
    
    -- Add percentage_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'percentage_score') THEN
        ALTER TABLE assessments ADD COLUMN percentage_score DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'status') THEN
        ALTER TABLE assessments ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add remarks column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'remarks') THEN
        ALTER TABLE assessments ADD COLUMN remarks TEXT;
    END IF;
    
    -- Add acknowledged_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'acknowledged_at') THEN
        ALTER TABLE assessments ADD COLUMN acknowledged_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add acknowledged_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'acknowledged_by') THEN
        ALTER TABLE assessments ADD COLUMN acknowledged_by TEXT;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
ORDER BY ordinal_position;
