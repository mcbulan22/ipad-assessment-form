-- Update the assessment_acknowledgments table to handle IP addresses more flexibly
ALTER TABLE assessment_acknowledgments 
ALTER COLUMN ip_address TYPE TEXT;

-- Add a comment to clarify the column purpose
COMMENT ON COLUMN assessment_acknowledgments.ip_address IS 'Client IP address or "unknown" if not available';

-- Update any existing problematic records
UPDATE assessment_acknowledgments 
SET ip_address = 'unknown' 
WHERE ip_address IS NULL OR LENGTH(ip_address) > 45;
