-- Update RLS policies for admin access
DROP POLICY IF EXISTS "Allow public insert access to assessments" ON assessments;
DROP POLICY IF EXISTS "Allow public read access to assessments" ON assessments;

-- Create more specific policies
CREATE POLICY "Allow authenticated users to read assessments" ON assessments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public insert access to assessments" ON assessments
    FOR INSERT WITH CHECK (true);

-- Add policies for marking sheets management
CREATE POLICY "Allow authenticated users to manage marking_sheets" ON marking_sheets
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage checklist_items" ON checklist_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Create an admin user (run this in Supabase Auth)
-- You'll need to create this user through the Supabase dashboard or Auth API
-- Email: admin@example.com
-- Password: your-secure-password
