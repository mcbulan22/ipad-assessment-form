-- Check what policies exist and their details
SELECT 
    tablename,
    policyname,
    cmd as operation,
    permissive,
    CASE 
        WHEN qual IS NULL THEN 'No restriction'
        ELSE qual
    END as using_clause,
    CASE 
        WHEN with_check IS NULL THEN 'No restriction'
        ELSE with_check
    END as with_check_clause
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

-- Show sample data to verify tables exist
SELECT 'marking_sheets' as table_name, count(*) as record_count FROM marking_sheets
UNION ALL
SELECT 'checklist_items' as table_name, count(*) as record_count FROM checklist_items
UNION ALL
SELECT 'assessments' as table_name, count(*) as record_count FROM assessments;
