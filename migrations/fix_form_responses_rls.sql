-- Fix form_responses RLS policy to allow submitting for teammates
-- This migration fixes the issue where users cannot create form responses on behalf of teammates

-- Drop the restrictive policy that only allows users to insert their own responses
DROP POLICY IF EXISTS "Users can insert own responses" ON form_responses;

-- Create a new policy that allows users to create responses for themselves and their teammates
-- (teammates are defined as users assigned to the same form)
CREATE POLICY "Users can insert responses for teammates"
ON form_responses FOR INSERT
WITH CHECK (
  -- Allow inserting responses for yourself
  respondent_id = auth.uid()
  OR
  -- Allow inserting responses for teammates (users assigned to the same form)
  respondent_id IN (
    SELECT fa.employee_id 
    FROM form_assignments fa
    WHERE fa.form_id = form_id  -- The form being submitted
    AND EXISTS (
      -- Ensure the current user is also assigned to this form
      SELECT 1 FROM form_assignments fa2 
      WHERE fa2.form_id = fa.form_id 
      AND fa2.employee_id = auth.uid()
    )
  )
);

-- Also create an UPDATE policy for form_responses (in case needed)
DROP POLICY IF EXISTS "Users can update responses for teammates" ON form_responses;
CREATE POLICY "Users can update responses for teammates"
ON form_responses FOR UPDATE
USING (
  -- Allow updating responses for yourself
  respondent_id = auth.uid()
  OR
  -- Allow updating responses for teammates (users assigned to the same form)
  respondent_id IN (
    SELECT fa.employee_id 
    FROM form_assignments fa
    WHERE fa.form_id = form_id
    AND EXISTS (
      -- Ensure the current user is also assigned to this form
      SELECT 1 FROM form_assignments fa2 
      WHERE fa2.form_id = fa.form_id 
      AND fa2.employee_id = auth.uid()
    )
  )
);

-- Fix form_response_answers RLS policy as well
-- The answers table has the same issue - it only allows inserting answers for your own responses

-- Drop the restrictive policy that only allows users to insert answers for their own responses  
DROP POLICY IF EXISTS "Users can insert own answers" ON form_response_answers;

-- Create a new policy that allows users to insert answers for responses of teammates
CREATE POLICY "Users can insert answers for teammate responses"
ON form_response_answers FOR INSERT
WITH CHECK (
  response_id IN (
    SELECT fr.id FROM form_responses fr
    WHERE 
      -- Allow answers for your own responses
      fr.respondent_id = auth.uid()
      OR
      -- Allow answers for teammate responses (users assigned to the same form)
      fr.respondent_id IN (
        SELECT fa.employee_id 
        FROM form_assignments fa
        WHERE fa.form_id = fr.form_id  -- The form being submitted
        AND EXISTS (
          -- Ensure the current user is also assigned to this form
          SELECT 1 FROM form_assignments fa2 
          WHERE fa2.form_id = fa.form_id 
          AND fa2.employee_id = auth.uid()
        )
      )
  )
);

-- Also create an UPDATE policy for form_response_answers (in case needed)
DROP POLICY IF EXISTS "Users can update answers for teammate responses" ON form_response_answers;
CREATE POLICY "Users can update answers for teammate responses"
ON form_response_answers FOR UPDATE
USING (
  response_id IN (
    SELECT fr.id FROM form_responses fr
    WHERE 
      -- Allow answers for your own responses
      fr.respondent_id = auth.uid()
      OR
      -- Allow answers for teammate responses (users assigned to the same form)
      fr.respondent_id IN (
        SELECT fa.employee_id 
        FROM form_assignments fa
        WHERE fa.form_id = fr.form_id
        AND EXISTS (
          -- Ensure the current user is also assigned to this form
          SELECT 1 FROM form_assignments fa2 
          WHERE fa2.form_id = fa.form_id 
          AND fa2.employee_id = auth.uid()
        )
      )
  )
);

-- Show diagnostic information
DO $$ 
BEGIN
  RAISE NOTICE '✅ form_responses RLS policies updated to allow teammate submissions';
  RAISE NOTICE '✅ form_response_answers RLS policies updated to allow teammate answer submissions';
  RAISE NOTICE 'ℹ️  Users can now create and update form responses and answers for teammates assigned to the same form';
END $$; 