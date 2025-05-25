-- First, let's check and add missing columns to marking_sheets
DO $$ 
BEGIN
    -- Add passing_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'marking_sheets' AND column_name = 'passing_score') THEN
        ALTER TABLE marking_sheets ADD COLUMN passing_score INTEGER DEFAULT 70;
    END IF;
    
    -- Add total_points column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'marking_sheets' AND column_name = 'total_points') THEN
        ALTER TABLE marking_sheets ADD COLUMN total_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add missing columns to checklist_items
DO $$ 
BEGIN
    -- Add points column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'checklist_items' AND column_name = 'points') THEN
        ALTER TABLE checklist_items ADD COLUMN points INTEGER DEFAULT 1;
    END IF;
    
    -- Add is_critical column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'checklist_items' AND column_name = 'is_critical') THEN
        ALTER TABLE checklist_items ADD COLUMN is_critical BOOLEAN DEFAULT false;
    END IF;
    
    -- Add critical_condition column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'checklist_items' AND column_name = 'critical_condition') THEN
        ALTER TABLE checklist_items ADD COLUMN critical_condition TEXT;
    END IF;
END $$;

-- Add missing columns to assessments
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

-- Create acknowledgments table if it doesn't exist
CREATE TABLE IF NOT EXISTS assessment_acknowledgments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_signature TEXT,
    acknowledgment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_assessment_acknowledgments_assessment_id ON assessment_acknowledgments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);

-- Enable RLS for new table
ALTER TABLE assessment_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Public insert acknowledgments" ON assessment_acknowledgments;
DROP POLICY IF EXISTS "Authenticated read acknowledgments" ON assessment_acknowledgments;

-- Create policies for acknowledgments
CREATE POLICY "Public insert acknowledgments" ON assessment_acknowledgments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated read acknowledgments" ON assessment_acknowledgments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Update existing data with default values
UPDATE checklist_items SET 
    points = CASE 
        WHEN text ILIKE '%safety%' THEN 10
        WHEN category = 'Critical Thinking' THEN 15
        WHEN category = 'Problem Solving' THEN 12
        ELSE 8
    END,
    is_critical = CASE 
        WHEN text ILIKE '%safety%' THEN true
        ELSE false
    END,
    critical_condition = CASE 
        WHEN text ILIKE '%safety%' THEN 'If not checked, student automatically fails'
        ELSE NULL
    END
WHERE points IS NULL OR points = 1;

-- Update marking sheets with calculated totals
UPDATE marking_sheets SET 
    total_points = COALESCE((
        SELECT SUM(points) 
        FROM checklist_items 
        WHERE checklist_items.marking_sheet_id = marking_sheets.id
    ), 0),
    passing_score = CASE 
        WHEN name ILIKE '%science%' THEN 80
        WHEN name ILIKE '%math%' THEN 75
        ELSE 70
    END
WHERE total_points = 0 OR passing_score IS NULL;
