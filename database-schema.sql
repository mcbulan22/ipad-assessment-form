-- Create marking_sheets table
CREATE TABLE IF NOT EXISTS marking_sheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    marking_sheet_id UUID REFERENCES marking_sheets(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    category TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessments table
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

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access to marking_sheets" ON marking_sheets
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to checklist_items" ON checklist_items
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to assessments" ON assessments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to assessments" ON assessments
    FOR SELECT USING (true);

-- Insert sample data
INSERT INTO marking_sheets (name, description) VALUES 
    ('Mathematics Assessment - Grade 5', 'Comprehensive math skills assessment for 5th grade students'),
    ('Reading Comprehension - Level 3', 'Reading comprehension and critical thinking assessment'),
    ('Science Lab Skills Assessment', 'Practical science laboratory skills evaluation')
ON CONFLICT DO NOTHING;

-- Get the IDs of the inserted marking sheets for checklist items
DO $$
DECLARE
    math_sheet_id UUID;
    reading_sheet_id UUID;
    science_sheet_id UUID;
BEGIN
    SELECT id INTO math_sheet_id FROM marking_sheets WHERE name = 'Mathematics Assessment - Grade 5';
    SELECT id INTO reading_sheet_id FROM marking_sheets WHERE name = 'Reading Comprehension - Level 3';
    SELECT id INTO science_sheet_id FROM marking_sheets WHERE name = 'Science Lab Skills Assessment';

    -- Insert checklist items for Math Assessment
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
        (math_sheet_id, 'Can solve word problems', 'Problem Solving', 10)
    ON CONFLICT DO NOTHING;

    -- Insert checklist items for Reading Assessment
    INSERT INTO checklist_items (marking_sheet_id, text, category, order_index) VALUES 
        (reading_sheet_id, 'Can identify main idea in a passage', 'Comprehension', 1),
        (reading_sheet_id, 'Can make inferences from text', 'Critical Thinking', 2),
        (reading_sheet_id, 'Can identify supporting details', 'Comprehension', 3),
        (reading_sheet_id, 'Demonstrates fluent reading', 'Fluency', 4),
        (reading_sheet_id, 'Can summarize key points', 'Comprehension', 5),
        (reading_sheet_id, 'Understands vocabulary in context', 'Vocabulary', 6),
        (reading_sheet_id, 'Can compare and contrast ideas', 'Critical Thinking', 7)
    ON CONFLICT DO NOTHING;

    -- Insert checklist items for Science Assessment
    INSERT INTO checklist_items (marking_sheet_id, text, category, order_index) VALUES 
        (science_sheet_id, 'Follows safety procedures', 'Safety', 1),
        (science_sheet_id, 'Uses equipment properly', 'Technical Skills', 2),
        (science_sheet_id, 'Records observations accurately', 'Documentation', 3),
        (science_sheet_id, 'Draws logical conclusions', 'Analysis', 4),
        (science_sheet_id, 'Formulates hypotheses', 'Scientific Method', 5),
        (science_sheet_id, 'Conducts controlled experiments', 'Scientific Method', 6),
        (science_sheet_id, 'Communicates findings clearly', 'Communication', 7)
    ON CONFLICT DO NOTHING;
END $$;
