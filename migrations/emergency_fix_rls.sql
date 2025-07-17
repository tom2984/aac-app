-- EMERGENCY FIX: Remove problematic RLS policies causing infinite recursion
-- This creates simpler policies without circular dependencies

-- STEP 1: Disable RLS temporarily on all tables to stop the recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_response_answers DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies to clear any problematic ones
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON profiles';
    END LOOP;
    
    -- Drop all policies on form_assignments
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'form_assignments'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON form_assignments';
    END LOOP;
    
    -- Drop all policies on forms
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'forms'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON forms';
    END LOOP;
    
    -- Drop all policies on form_questions
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'form_questions'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON form_questions';
    END LOOP;
    
    -- Drop all policies on form_responses
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'form_responses'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON form_responses';
    END LOOP;
    
    -- Drop all policies on form_response_answers
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'form_response_answers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON form_response_answers';
    END LOOP;
END $$;

-- STEP 3: Create SIMPLE, NON-RECURSIVE policies

-- PROFILES: Simple policies without table joins
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own_access" ON profiles FOR ALL
USING (auth.uid() = id);

-- For now, allow all authenticated users to read all profiles
-- This is less secure but prevents the recursion issue
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- FORMS: Simple policies without referencing form_assignments
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forms_own_access" ON forms FOR ALL
USING (created_by = auth.uid());

-- Allow reading forms by authenticated users (we'll control access via the app logic)
CREATE POLICY "forms_read_all" ON forms FOR SELECT
USING (auth.role() = 'authenticated');

-- FORM_ASSIGNMENTS: Simple policies without referencing forms
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_employee_access" ON form_assignments FOR ALL
USING (employee_id = auth.uid());

CREATE POLICY "assignments_assigner_access" ON form_assignments FOR ALL
USING (assigned_by = auth.uid());

-- FORM_QUESTIONS: Simple policies
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_read_all" ON form_questions FOR SELECT
USING (auth.role() = 'authenticated');

-- FORM_RESPONSES: Simple policies
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "responses_own_access" ON form_responses FOR ALL
USING (respondent_id = auth.uid());

-- FORM_RESPONSE_ANSWERS: Simple policies
ALTER TABLE form_response_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers_read_all" ON form_response_answers FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "answers_own_insert" ON form_response_answers FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_forms_created_by ON forms(created_by);
CREATE INDEX IF NOT EXISTS idx_form_assignments_employee ON form_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_assigner ON form_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_form_responses_respondent ON form_responses(respondent_id);

-- Add comments
COMMENT ON POLICY "profiles_read_all" ON profiles IS 
'Temporary policy allowing all authenticated users to read profiles - prevents recursion issues';

COMMENT ON POLICY "forms_read_all" ON forms IS 
'Temporary policy allowing all authenticated users to read forms - prevents recursion issues'; 