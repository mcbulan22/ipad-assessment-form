-- Check what policies exist
SELECT 
    tablename,
    policyname,
    cmd as operation,
    permissive,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename IN ('assessments', 'marking_sheets', 'checklist_items')
ORDER BY tablename, policyname;

-- Also check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('assessments', 'marking_sheets', 'checklist_items');
