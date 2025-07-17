-- DEFINITIVE FIX: Allow teammate form submissions
-- This migration completely resets the form_responses and form_response_answers RLS policies
-- to allow users to submit forms on behalf of teammates assigned to the same form

-- ====================================
-- STEP 1: Drop ALL existing policies
-- ====================================

-- Drop all form_responses policies (regardless of name)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'form_responses'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON form_responses';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Drop all form_response_answers policies (regardless of name)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'form_response_answers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON form_response_answers';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- ====================================
-- STEP 2: Create new comprehensive policies
-- ====================================

-- form_responses: Allow SELECT for own responses and responses for forms you created
CREATE POLICY "form_responses_select_comprehensive"
ON form_responses FOR SELECT
USING (
  -- Your own responses
  respondent_id = auth.uid()
  OR
  -- Responses to forms you created
  form_id IN (
    SELECT id FROM forms WHERE created_by = auth.uid()
  )
  OR
  -- Responses for forms you're assigned to (to see teammate responses)
  form_id IN (
    SELECT form_id FROM form_assignments WHERE employee_id = auth.uid()
  )
);

-- form_responses: Allow INSERT for yourself and teammates on shared forms
CREATE POLICY "form_responses_insert_teammates"
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

-- form_responses: Allow UPDATE for own responses and teammate responses on shared forms
CREATE POLICY "form_responses_update_teammates"
ON form_responses FOR UPDATE
USING (
  -- Your own responses
  respondent_id = auth.uid()
  OR
  -- Teammate responses on forms you're both assigned to
  respondent_id IN (
    SELECT fa.employee_id 
    FROM form_assignments fa
    WHERE fa.form_id = form_id
    AND EXISTS (
      SELECT 1 FROM form_assignments fa2 
      WHERE fa2.form_id = fa.form_id 
      AND fa2.employee_id = auth.uid()
    )
  )
);

-- form_response_answers: Allow SELECT for answers to accessible responses
CREATE POLICY "form_response_answers_select_comprehensive"
ON form_response_answers FOR SELECT
USING (
  response_id IN (
    SELECT fr.id FROM form_responses fr
    WHERE 
      -- Your own responses
      fr.respondent_id = auth.uid()
      OR
      -- Responses to forms you created
      fr.form_id IN (
        SELECT id FROM forms WHERE created_by = auth.uid()
      )
      OR
      -- Responses for forms you're assigned to
      fr.form_id IN (
        SELECT form_id FROM form_assignments WHERE employee_id = auth.uid()
      )
  )
);

-- form_response_answers: Allow INSERT for answers to responses you can access
CREATE POLICY "form_response_answers_insert_teammates"
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

-- form_response_answers: Allow UPDATE for answers to accessible responses
CREATE POLICY "form_response_answers_update_teammates"
ON form_response_answers FOR UPDATE
USING (
  response_id IN (
    SELECT fr.id FROM form_responses fr
    WHERE 
      -- Your own responses
      fr.respondent_id = auth.uid()
      OR
      -- Teammate responses on forms you're both assigned to
      fr.respondent_id IN (
        SELECT fa.employee_id 
        FROM form_assignments fa
        WHERE fa.form_id = fr.form_id
        AND EXISTS (
          SELECT 1 FROM form_assignments fa2 
          WHERE fa2.form_id = fa.form_id 
          AND fa2.employee_id = auth.uid()
        )
      )
  )
);

-- ====================================
-- STEP 3: Verification and diagnostics
-- ====================================

-- Show all current policies to verify they're correct
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== Current form_responses policies ===';
    FOR policy_record IN 
        SELECT policyname, cmd FROM pg_policies WHERE tablename = 'form_responses'
    LOOP
        RAISE NOTICE 'Policy: % (%)' , policy_record.policyname, policy_record.cmd;
    END LOOP;
    
    RAISE NOTICE '=== Current form_response_answers policies ===';
    FOR policy_record IN 
        SELECT policyname, cmd FROM pg_policies WHERE tablename = 'form_response_answers'
    LOOP
        RAISE NOTICE 'Policy: % (%)' , policy_record.policyname, policy_record.cmd;
    END LOOP;
    
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'ℹ️  Users can now submit forms for teammates assigned to the same form';
END $$; 