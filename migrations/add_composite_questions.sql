-- Add composite question support to form_questions table
-- Migration: Add composite question type and sub_questions field

-- First, add the sub_questions column
ALTER TABLE form_questions 
ADD COLUMN IF NOT EXISTS sub_questions JSONB;

-- Check if question_type is constrained and update accordingly
-- If it's an enum type, add the value; if it's a CHECK constraint, update it
-- This will vary depending on how the database was initially set up

-- For now, we'll assume it's a text field with potential CHECK constraints
-- The application will handle validation of the 'composite' type

-- Add a comment to document the sub_questions structure
COMMENT ON COLUMN form_questions.sub_questions IS 'JSON array of sub-questions for composite question types. Each sub-question should have a "question" field.';

-- Add index on question_type for better performance
CREATE INDEX IF NOT EXISTS idx_form_questions_type ON form_questions(question_type);

-- Example of sub_questions structure:
-- [
--   {"question": "What is your primary concern?"},
--   {"question": "How would you rate the severity?"},
--   {"question": "What steps have you taken?"}
-- ] 