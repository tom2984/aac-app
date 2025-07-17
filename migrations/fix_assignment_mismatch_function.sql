-- Migration: Fix Assignment Mismatch Function
-- Date: 2025-07-17
-- Purpose: Create a database function to fix metadata vs assignment record mismatches

-- Drop function if exists
DROP FUNCTION IF EXISTS fix_assignment_mismatch(uuid, uuid);

-- Create function to fix assignment mismatches (admin only)
CREATE OR REPLACE FUNCTION fix_assignment_mismatch(
  target_form_id uuid,
  admin_user_id uuid
)
RETURNS TABLE (
  action text,
  employee_id uuid,
  assignment_id uuid,
  success boolean,
  error_message text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  form_record forms%ROWTYPE;
  metadata_users uuid[];
  existing_assignments uuid[];
  missing_user uuid;
  new_assignment_id uuid;
  admin_profile profiles%ROWTYPE;
BEGIN
  -- Verify admin user exists and has admin role
  SELECT * INTO admin_profile FROM profiles WHERE id = admin_user_id;
  
  IF admin_profile.id IS NULL THEN
    RETURN QUERY SELECT 'error'::text, NULL::uuid, NULL::uuid, false, 'Admin user not found';
    RETURN;
  END IF;
  
  IF admin_profile.role != 'admin' THEN
    RETURN QUERY SELECT 'error'::text, NULL::uuid, NULL::uuid, false, 'User is not an admin';
    RETURN;
  END IF;
  
  -- Get form data
  SELECT * INTO form_record FROM forms WHERE id = target_form_id;
  
  IF form_record.id IS NULL THEN
    RETURN QUERY SELECT 'error'::text, NULL::uuid, NULL::uuid, false, 'Form not found';
    RETURN;
  END IF;
  
  -- Extract assigned employees from metadata
  metadata_users := ARRAY(
    SELECT jsonb_array_elements_text(form_record.metadata->'assigned_employees')::uuid
  );
  
  -- Get existing assignment employee IDs
  existing_assignments := ARRAY(
    SELECT employee_id FROM form_assignments WHERE form_id = target_form_id
  );
  
  -- Find and create missing assignments
  FOR missing_user IN 
    SELECT unnest(metadata_users) 
    EXCEPT 
    SELECT unnest(existing_assignments)
  LOOP
    BEGIN
      -- Create missing assignment
      INSERT INTO form_assignments (
        form_id,
        employee_id,
        assigned_by,
        status,
        due_date,
        created_at,
        updated_at
      ) VALUES (
        target_form_id,
        missing_user,
        form_record.created_by, -- Use original form creator
        'pending',
        (form_record.settings->>'due_date')::date,
        NOW(),
        NOW()
      ) RETURNING id INTO new_assignment_id;
      
      RETURN QUERY SELECT 
        'created'::text, 
        missing_user, 
        new_assignment_id, 
        true, 
        NULL::text;
        
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        'failed'::text, 
        missing_user, 
        NULL::uuid, 
        false, 
        SQLERRM;
    END;
  END LOOP;
  
  -- Return success if no missing assignments found
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'no_action'::text, NULL::uuid, NULL::uuid, true, 'No missing assignments found';
  END IF;
  
END;
$$;

-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION fix_assignment_mismatch(uuid, uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION fix_assignment_mismatch IS 'Admin-only function to fix assignment metadata mismatches by creating missing assignment records'; 