-- Test if we can insert an assessment (this should work after fixing RLS)
INSERT INTO assessments (
    student_name,
    assessor_name,
    marking_sheet_id,
    checklist_responses,
    total_items,
    completed_items,
    completion_percentage
) VALUES (
    'Test Student',
    'Test Assessor',
    (SELECT id FROM marking_sheets LIMIT 1),
    '{"test": true}',
    1,
    1,
    100.0
);

-- Check if the insert worked
SELECT * FROM assessments WHERE student_name = 'Test Student';

-- Clean up the test record
DELETE FROM assessments WHERE student_name = 'Test Student';
