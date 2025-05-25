-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Allow public read access to checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow public insert access to assessments" ON assessments;
DROP POLICY IF EXISTS "Allow public read access to assessments" ON assessments;
DROP POLICY IF EXISTS "Allow authenticated users to read assessments" ON assessments;
DROP POLICY IF EXISTS "Allow authenticated users to manage marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Allow authenticated users to manage checklist_items" ON checklist_items;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS marking_sheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    marking_sheet_id UUID REFERENCES marking_sheets(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    category TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    assessor_name TEXT NOT NULL,
    marking_sheet_id UUID REFERENCES marking_sheets(id) ON DELETE CASCADE,
    checklist_responses JSONB NOT NULL DEFAULT '{}',
    total_items INTEGER,
    completed_items INTEGER,
    completion_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_marking_sheet_id ON checklist_items(marking_sheet_id);
CREATE INDEX IF NOT EXISTS idx_assessments_marking_sheet_id ON assessments(marking_sheet_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE marking_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- Public can read marking sheets and checklist items (for the assessment form)
CREATE POLICY "Public read marking_sheets" ON marking_sheets
    FOR SELECT USING (true);

CREATE POLICY "Public read checklist_items" ON checklist_items
    FOR SELECT USING (true);

-- Authenticated users can manage marking sheets and checklist items (admin functions)
CREATE POLICY "Authenticated manage marking_sheets" ON marking_sheets
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated manage checklist_items" ON checklist_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Anyone can insert assessments (public form submission)
CREATE POLICY "Public insert assessments" ON assessments
    FOR INSERT WITH CHECK (true);

-- Only authenticated users can read assessments (admin view)
CREATE POLICY "Authenticated read assessments" ON assessments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample data (only if tables are empty)
INSERT INTO marking_sheets (name, description) 
SELECT * FROM (VALUES 
    ('Mathematics Assessment - Grade 5', 'Comprehensive math skills assessment for 5th grade students'),
    ('Reading Comprehension - Level 3', 'Reading comprehension and critical thinking assessment'),
    ('Science Lab Skills Assessment', 'Practical science laboratory skills evaluation')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM marking_sheets);

-- Insert checklist items for sample data
DO $$
DECLARE
    math_sheet_id UUID;
    reading_sheet_id UUID;
    science_sheet_id UUID;
BEGIN
    -- Only proceed if we have marking sheets but no checklist items
    IF EXISTS (SELECT 1 FROM marking_sheets) AND NOT EXISTS (SELECT 1 FROM checklist_items) THEN
        
        SELECT id INTO math_sheet_id FROM marking_sheets WHERE name = 'Mathematics Assessment - Grade 5' LIMIT 1;
        SELECT id INTO reading_sheet_id FROM marking_sheets WHERE name = 'Reading Comprehension - Level 3' LIMIT 1;
        SELECT id INTO science_sheet_id FROM marking_sheets WHERE name = 'Science Lab Skills Assessment' LIMIT 1;

        -- Insert checklist items for Math Assessment
        IF math_sheet_id IS NOT NULL THEN
            INSERT INTO checklist_items (marking_sheet_id, text, category, order_index) VALUES 
                (math_sheet_id, 'Can solve basic addition problems', 'Arithmetic', 1),
                (math_sheet_id, 'Can solve basic subtraction problems', 'Arithmetic', 2),
                (math_sheet_id, 'Can solve basic multiplication problems', 'Arithmetic', 3),
                (math_sheet_id, 'Can solve basic division problems', 'Arithmetic', 4),
                (math_sheet_id, 'Understands place value concepts', 'Number Sense', 5),
                (math_sheet_id, 'Can work with fractions', 'Number Sense', 6),
                (math_sheet_id, 'Can identify geometric shapes', 'Geometry', 7),
                (math_sheet_id, 'Understands area and perimeter', 'Geometry', 8),
                (math_sheet_id, 'Can read and interpret simple graphs', 'Data Analysis', 9),
                (math_sheet_id, 'Can solve word problems', 'Problem Solving', 10);
        END IF;

        -- Insert checklist items for Reading Assessment
        IF reading_sheet_id IS NOT NULL THEN
            INSERT INTO checklist_items (marking_sheet_id, text, category, order_index) VALUES 
                (reading_sheet_id, 'Can identify main idea in a passage', 'Comprehension', 1),
                (reading_sheet_id, 'Can make inferences from text', 'Critical Thinking', 2),
                (reading_sheet_id, 'Can identify supporting details', 'Comprehension', 3),
                (reading_sheet_id, 'Demonstrates fluent reading', 'Fluency', 4),
                (reading_sheet_id, 'Can summarize key points', 'Comprehension', 5),
                (reading_sheet_id, 'Understands vocabulary in context', 'Vocabulary', 6),
                (reading_sheet_id, 'Can compare and contrast ideas', 'Critical Thinking', 7);
        END IF;

        -- Insert checklist items for Science Assessment
        IF science_sheet_id IS NOT NULL THEN
            INSERT INTO checklist_items (marking_sheet_id, text, category, order_index) VALUES 
                (science_sheet_id, 'Follows safety procedures', 'Safety', 1),
                (science_sheet_id, 'Uses equipment properly', 'Technical Skills', 2),
                (science_sheet_id, 'Records observations accurately', 'Documentation', 3),
                (science_sheet_id, 'Draws logical conclusions', 'Analysis', 4),
                (science_sheet_id, 'Formulates hypotheses', 'Scientific Method', 5),
                (science_sheet_id, 'Conducts controlled experiments', 'Scientific Method', 6),
                (science_sheet_id, 'Communicates findings clearly', 'Communication', 7);
        END IF;
        
    END IF;
END $$;
