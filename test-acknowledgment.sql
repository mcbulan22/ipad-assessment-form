-- Test if we can insert an acknowledgment record
INSERT INTO assessment_acknowledgments (
    assessment_id,
    student_signature,
    ip_address,
    user_agent
) VALUES (
    (SELECT id FROM assessments LIMIT 1),
    'Test Student',
    'unknown',
    'Test Browser'
);

-- Check if it was inserted
SELECT * FROM assessment_acknowledgments ORDER BY acknowledgment_date DESC LIMIT 1;

-- Clean up the test record
DELETE FROM assessment_acknowledgments WHERE student_signature = 'Test Student';

SELECT 'Acknowledgment test completed successfully' as result;
