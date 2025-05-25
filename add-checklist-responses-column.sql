-- Add the missing checklist_responses column to assessments table
DO $$ 
BEGIN
    -- Add checklist_responses column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'checklist_responses'
    ) THEN
        ALTER TABLE assessments ADD COLUMN checklist_responses JSONB;
        RAISE NOTICE 'Added checklist_responses column';
    ELSE
        RAISE NOTICE 'checklist_responses column already exists';
    END IF;

    -- Add other missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'total_items'
    ) THEN
        ALTER TABLE assessments ADD COLUMN total_items INTEGER;
        RAISE NOTICE 'Added total_items column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'completed_items'
    ) THEN
        ALTER TABLE assessments ADD COLUMN completed_items INTEGER;
        RAISE NOTICE 'Added completed_items column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'completion_percentage'
    ) THEN
        ALTER TABLE assessments ADD COLUMN completion_percentage DECIMAL(5,2);
        RAISE NOTICE 'Added completion_percentage column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'total_score'
    ) THEN
        ALTER TABLE assessments ADD COLUMN total_score INTEGER;
        RAISE NOTICE 'Added total_score column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'max_possible_score'
    ) THEN
        ALTER TABLE assessments ADD COLUMN max_possible_score INTEGER;
        RAISE NOTICE 'Added max_possible_score column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'percentage_score'
    ) THEN
        ALTER TABLE assessments ADD COLUMN percentage_score DECIMAL(5,2);
        RAISE NOTICE 'Added percentage_score column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE assessments ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
        RAISE NOTICE 'Added status column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'remarks'
    ) THEN
        ALTER TABLE assessments ADD COLUMN remarks TEXT;
        RAISE NOTICE 'Added remarks column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'acknowledged_at'
    ) THEN
        ALTER TABLE assessments ADD COLUMN acknowledged_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added acknowledged_at column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' 
        AND column_name = 'acknowledged_by'
    ) THEN
        ALTER TABLE assessments ADD COLUMN acknowledged_by TEXT;
        RAISE NOTICE 'Added acknowledged_by column';
    END IF;

END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
ORDER BY ordinal_position;
