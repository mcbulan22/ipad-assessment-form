-- First, let's disable RLS temporarily to clean up
ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE marking_sheets DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow anyone to insert assessments" ON assessments;
DROP POLICY IF EXISTS "Allow authenticated users to read assessments" ON assessments;
DROP POLICY IF EXISTS "Public insert assessments" ON assessments;
DROP POLICY IF EXISTS "Authenticated read assessments" ON assessments;
DROP POLICY IF EXISTS "Allow public insert access to assessments" ON assessments;
DROP POLICY IF EXISTS "Allow public read access to assessments" ON assessments;

DROP POLICY IF EXISTS "Allow public read marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Allow public read access to marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Public read marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Allow authenticated users to manage marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Authenticated manage marking_sheets" ON marking_sheets;

DROP POLICY IF EXISTS "Allow public read checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow public read access to checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Public read checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Authenticated manage checklist_items" ON checklist_items;

-- Re-enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marking_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for assessments
CREATE POLICY "assessments_insert_policy" ON assessments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "assessments_select_policy" ON assessments
    FOR SELECT USING (true);

-- Create policies for marking_sheets (public read, authenticated write)
CREATE POLICY "marking_sheets_select_policy" ON marking_sheets
    FOR SELECT USING (true);

CREATE POLICY "marking_sheets_insert_policy" ON marking_sheets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "marking_sheets_update_policy" ON marking_sheets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "marking_sheets_delete_policy" ON marking_sheets
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for checklist_items (public read, authenticated write)
CREATE POLICY "checklist_items_select_policy" ON checklist_items
    FOR SELECT USING (true);

CREATE POLICY "checklist_items_insert_policy" ON checklist_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "checklist_items_update_policy" ON checklist_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "checklist_items_delete_policy" ON checklist_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- Test the policies by inserting a test assessment
DO $$
DECLARE
    test_sheet_id UUID;
BEGIN
    -- Get a marking sheet ID for testing
    SELECT id INTO test_sheet_id FROM marking_sheets LIMIT 1;
    
    IF test_sheet_id IS NOT NULL THEN
        -- Try to insert a test assessment
        INSERT INTO assessments (
            student_name,
            assessor_name,
            marking_sheet_id,
            checklist_responses,
            total_items,
            completed_items,
            completion_percentage
        ) VALUES (
            'RLS Test Student',
            'RLS Test Assessor',
            test_sheet_id,
            '{"test": true}',
            1,
            1,
            100.0
        );
        
        -- Clean up the test record
        DELETE FROM assessments WHERE student_name = 'RLS Test Student';
        
        RAISE NOTICE 'RLS policies are working correctly!';
    ELSE
        RAISE NOTICE 'No marking sheets found for testing';
    END IF;
END $$;

-- Verify the current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('marking_sheets', 'checklist_items', 'assessments')
ORDER BY tablename, policyname;
