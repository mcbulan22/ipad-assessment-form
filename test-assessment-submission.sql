-- Test assessment submission
INSERT INTO assessments (
    student_name,
    assessor_name,
    marking_sheet_id,
    checklist_responses,
    total_items,
    completed_items,
    completion_percentage,
    total_score,
    max_possible_score,
    percentage_score,
    status,
    remarks,
    acknowledged_at,
    acknowledged_by
) VALUES (
    'Test Student',
    'Test Assessor',
    (SELECT id FROM marking_sheets LIMIT 1),
    '{"test": true}',
    4,
    4,
    100.00,
    100,
    100,
    100.00,
    'passed',
    'Test assessment',
    NOW(),
    'Student: Test Student | Assessor: Test Assessor'
);

-- Check if the test record was inserted
SELECT * FROM assessments WHERE student_name = 'Test Student';

-- Clean up test record
DELETE FROM assessments WHERE student_name = 'Test Student';
