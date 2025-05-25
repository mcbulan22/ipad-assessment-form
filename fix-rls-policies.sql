-- Drop existing policies that might be blocking submissions
DROP POLICY IF EXISTS "Public insert assessments" ON assessments;
DROP POLICY IF EXISTS "Authenticated read assessments" ON assessments;
DROP POLICY IF EXISTS "Allow public insert access to assessments" ON assessments;
DROP POLICY IF EXISTS "Allow authenticated users to read assessments" ON assessments;

-- Create new policies that allow public assessment submissions
CREATE POLICY "Allow anyone to insert assessments" ON assessments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read assessments" ON assessments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Also ensure marking sheets and checklist items can be read publicly
DROP POLICY IF EXISTS "Public read marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Public read checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow public read access to marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Allow public read access to checklist_items" ON checklist_items;

-- Create policies for public reading of marking sheets and checklist items
CREATE POLICY "Allow public read marking_sheets" ON marking_sheets
    FOR SELECT USING (true);

CREATE POLICY "Allow public read checklist_items" ON checklist_items
    FOR SELECT USING (true);

-- Ensure authenticated users can manage marking sheets and checklist items
DROP POLICY IF EXISTS "Authenticated manage marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Authenticated manage checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage marking_sheets" ON marking_sheets;
DROP POLICY IF EXISTS "Allow authenticated users to manage checklist_items" ON checklist_items;

CREATE POLICY "Allow authenticated users to manage marking_sheets" ON marking_sheets
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage checklist_items" ON checklist_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Verify RLS is enabled on all tables
ALTER TABLE marking_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('marking_sheets', 'checklist_items', 'assessments')
ORDER BY tablename, policyname;
