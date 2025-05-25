-- Add new columns to existing tables
ALTER TABLE checklist_items 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS critical_condition TEXT;

ALTER TABLE marking_sheets 
ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_possible_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentage_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS acknowledged_by TEXT;

-- Create acknowledgments table for tracking student acknowledgments
CREATE TABLE IF NOT EXISTS assessment_acknowledgments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_signature TEXT,
    acknowledgment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assessment_acknowledgments_assessment_id ON assessment_acknowledgments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);

-- Enable RLS for new table
ALTER TABLE assessment_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Create policy for acknowledgments
CREATE POLICY "Public insert acknowledgments" ON assessment_acknowledgments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated read acknowledgments" ON assessment_acknowledgments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Update sample data with points and conditions
UPDATE checklist_items SET 
    points = CASE 
        WHEN text LIKE '%safety%' OR text LIKE '%Safety%' THEN 10
        WHEN category = 'Critical Thinking' THEN 15
        WHEN category = 'Problem Solving' THEN 12
        ELSE 8
    END,
    is_critical = CASE 
        WHEN text LIKE '%safety%' OR text LIKE '%Safety%' THEN true
        ELSE false
    END,
    critical_condition = CASE 
        WHEN text LIKE '%safety%' OR text LIKE '%Safety%' THEN 'If not checked, student automatically fails'
        ELSE NULL
    END
WHERE points IS NULL;

-- Update marking sheets with total points and passing scores
UPDATE marking_sheets SET 
    total_points = (
        SELECT COALESCE(SUM(points), 0) 
        FROM checklist_items 
        WHERE checklist_items.marking_sheet_id = marking_sheets.id
    ),
    passing_score = CASE 
        WHEN name LIKE '%Science%' THEN 80  -- Higher standard for science
        WHEN name LIKE '%Math%' THEN 75
        ELSE 70
    END
WHERE total_points = 0;
