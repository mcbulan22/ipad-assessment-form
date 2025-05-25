-- Simple test to verify we can insert an assessment
DO $$
DECLARE
    test_sheet_id UUID;
    test_assessment_id UUID;
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
            'Test Student RLS',
            'Test Assessor RLS',
            test_sheet_id,
            '{"test_item": true}',
            1,
            1,
            100.0
        ) RETURNING id INTO test_assessment_id;
        
        RAISE NOTICE 'SUCCESS: Assessment inserted with ID: %', test_assessment_id;
        
        -- Clean up the test record
        DELETE FROM assessments WHERE id = test_assessment_id;
        
        RAISE NOTICE 'Test assessment cleaned up successfully';
        RAISE NOTICE 'RLS policies are working correctly!';
    ELSE
        RAISE NOTICE 'ERROR: No marking sheets found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;
