-- Fix RLS policies for profiles and form_assignments tables
-- This allows users to see profiles of people they work with on forms

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view teammates profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can view profiles of people they share form assignments with
CREATE POLICY "Users can view teammates profiles" 
ON profiles FOR SELECT
USING (
  id IN (
    -- Get IDs of users who share form assignments with the current user
    SELECT DISTINCT fa1.employee_id 
    FROM form_assignments fa1
    WHERE fa1.form_id IN (
      SELECT fa2.form_id 
      FROM form_assignments fa2 
      WHERE fa2.employee_id = auth.uid()
    )
  )
  OR
  id IN (
    -- Get IDs of users who created forms assigned to the current user
    SELECT DISTINCT f.created_by
    FROM forms f
    JOIN form_assignments fa ON f.id = fa.form_id
    WHERE fa.employee_id = auth.uid()
  )
  OR
  id IN (
    -- Get IDs of users who were assigned forms created by the current user
    SELECT DISTINCT fa.employee_id
    FROM form_assignments fa
    JOIN forms f ON fa.form_id = f.id
    WHERE f.created_by = auth.uid()
  )
);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy 4: Users can insert their own profile (for new registrations)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Enable RLS on form_assignments table (if not already enabled)
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing form_assignments policies
DROP POLICY IF EXISTS "Users can view own assignments" ON form_assignments;
DROP POLICY IF EXISTS "Users can view team assignments" ON form_assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON form_assignments;
DROP POLICY IF EXISTS "form_assignments_select_policy" ON form_assignments;
DROP POLICY IF EXISTS "form_assignments_insert_policy" ON form_assignments;
DROP POLICY IF EXISTS "form_assignments_update_policy" ON form_assignments;

-- Policy 1: Users can view their own form assignments
CREATE POLICY "Users can view own assignments"
ON form_assignments FOR SELECT
USING (employee_id = auth.uid() OR assigned_by = auth.uid());

-- Policy 2: Users can view assignments for forms they created
CREATE POLICY "Users can view team assignments"
ON form_assignments FOR SELECT
USING (
  form_id IN (
    SELECT id FROM forms WHERE created_by = auth.uid()
  )
);

-- Policy 3: Users can update their own assignments (status changes)
CREATE POLICY "Users can update own assignments"
ON form_assignments FOR UPDATE
USING (employee_id = auth.uid() OR assigned_by = auth.uid());

-- Enable RLS on forms table (if not already enabled)
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing forms policies
DROP POLICY IF EXISTS "Users can view assigned forms" ON forms;
DROP POLICY IF EXISTS "Users can view own forms" ON forms;
DROP POLICY IF EXISTS "Users can insert forms" ON forms;
DROP POLICY IF EXISTS "Users can update own forms" ON forms;
DROP POLICY IF EXISTS "forms_select_policy" ON forms;
DROP POLICY IF EXISTS "forms_insert_policy" ON forms;
DROP POLICY IF EXISTS "forms_update_policy" ON forms;

-- Policy 1: Users can view forms they created
CREATE POLICY "Users can view own forms"
ON forms FOR SELECT
USING (created_by = auth.uid());

-- Policy 2: Users can view forms assigned to them
CREATE POLICY "Users can view assigned forms"
ON forms FOR SELECT
USING (
  id IN (
    SELECT form_id FROM form_assignments WHERE employee_id = auth.uid()
  )
);

-- Policy 3: Users can insert forms (create new forms)
CREATE POLICY "Users can insert forms"
ON forms FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Policy 4: Users can update their own forms
CREATE POLICY "Users can update own forms"
ON forms FOR UPDATE
USING (created_by = auth.uid());

-- Enable RLS on form_questions table
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing form_questions policies
DROP POLICY IF EXISTS "Users can view questions for accessible forms" ON form_questions;
DROP POLICY IF EXISTS "form_questions_select_policy" ON form_questions;

-- Policy: Users can view questions for forms they have access to
CREATE POLICY "Users can view questions for accessible forms"
ON form_questions FOR SELECT
USING (
  form_id IN (
    -- Forms created by the user
    SELECT id FROM forms WHERE created_by = auth.uid()
    UNION
    -- Forms assigned to the user
    SELECT form_id FROM form_assignments WHERE employee_id = auth.uid()
  )
);

-- Enable RLS on form_responses table
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing form_responses policies
DROP POLICY IF EXISTS "Users can view own responses" ON form_responses;
DROP POLICY IF EXISTS "Form creators can view responses" ON form_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON form_responses;
DROP POLICY IF EXISTS "form_responses_select_policy" ON form_responses;
DROP POLICY IF EXISTS "form_responses_insert_policy" ON form_responses;

-- Policy 1: Users can view their own responses
CREATE POLICY "Users can view own responses"
ON form_responses FOR SELECT
USING (respondent_id = auth.uid());

-- Policy 2: Form creators can view all responses to their forms
CREATE POLICY "Form creators can view responses"
ON form_responses FOR SELECT
USING (
  form_id IN (
    SELECT id FROM forms WHERE created_by = auth.uid()
  )
);

-- Policy 3: Users can insert their own responses
CREATE POLICY "Users can insert own responses"
ON form_responses FOR INSERT
WITH CHECK (respondent_id = auth.uid());

-- Enable RLS on form_response_answers table
ALTER TABLE form_response_answers ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing form_response_answers policies
DROP POLICY IF EXISTS "Users can view own answers" ON form_response_answers;
DROP POLICY IF EXISTS "Form creators can view answers" ON form_response_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON form_response_answers;
DROP POLICY IF EXISTS "form_response_answers_select_policy" ON form_response_answers;
DROP POLICY IF EXISTS "form_response_answers_insert_policy" ON form_response_answers;

-- Policy 1: Users can view answers to their own responses
CREATE POLICY "Users can view own answers"
ON form_response_answers FOR SELECT
USING (
  response_id IN (
    SELECT id FROM form_responses WHERE respondent_id = auth.uid()
  )
);

-- Policy 2: Form creators can view answers to responses for their forms
CREATE POLICY "Form creators can view answers"
ON form_response_answers FOR SELECT
USING (
  response_id IN (
    SELECT fr.id FROM form_responses fr
    JOIN forms f ON fr.form_id = f.id
    WHERE f.created_by = auth.uid()
  )
);

-- Policy 3: Users can insert answers to their own responses
CREATE POLICY "Users can insert own answers"
ON form_response_answers FOR INSERT
WITH CHECK (
  response_id IN (
    SELECT id FROM form_responses WHERE respondent_id = auth.uid()
  )
);

-- Create indexes for better performance with these policies
CREATE INDEX IF NOT EXISTS idx_form_assignments_employee_form ON form_assignments(employee_id, form_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_form_employee ON form_assignments(form_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_forms_created_by ON forms(created_by);
CREATE INDEX IF NOT EXISTS idx_form_responses_respondent ON form_responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form ON form_responses(form_id);

-- Comments for documentation
COMMENT ON POLICY "Users can view teammates profiles" ON profiles IS 
'Allows users to view profiles of people they work with on forms - teammates, form creators, and assignees';

COMMENT ON POLICY "Users can view team assignments" ON form_assignments IS 
'Allows form creators to see all assignments for their forms';

COMMENT ON POLICY "Users can view assigned forms" ON forms IS 
'Allows users to view forms that have been assigned to them'; 