-- Add password and enabled status columns to marking_sheets table
DO $$ 
BEGIN
    -- Add password column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marking_sheets' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE marking_sheets ADD COLUMN password TEXT;
        RAISE NOTICE 'Added password column';
    END IF;

    -- Add is_enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'marking_sheets' 
        AND column_name = 'is_enabled'
    ) THEN
        ALTER TABLE marking_sheets ADD COLUMN is_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_enabled column';
    END IF;
END $$;

-- Set default values for existing marking sheets
UPDATE marking_sheets 
SET 
    password = 'assess2024',
    is_enabled = true
WHERE password IS NULL OR is_enabled IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'marking_sheets' 
ORDER BY ordinal_position;
