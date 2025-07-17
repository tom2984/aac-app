-- Debug Form Assignments for tomws2984@gmail.com
-- Run these queries in Supabase SQL Editor

-- 1. Check if user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'tomws2984@gmail.com';

-- 2. Check if user profile exists
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at
FROM profiles 
WHERE email = 'tomws2984@gmail.com';

-- 3. Get the user ID for next queries (replace with actual ID from step 2)
-- You can also use this variable approach:
-- SET @user_id = (SELECT id FROM profiles WHERE email = 'tomws2984@gmail.com');

-- 4. Check form assignments for the user
SELECT 
  fa.id as assignment_id,
  fa.status,
  fa.due_date,
  fa.created_at as assigned_at,
  f.id as form_id,
  f.title as form_title,
  f.is_active as form_active,
  f.description,
  creator.email as created_by_email
FROM form_assignments fa
JOIN forms f ON fa.form_id = f.id
LEFT JOIN profiles creator ON f.created_by = creator.id
WHERE fa.employee_id = (SELECT id FROM profiles WHERE email = 'tomws2984@gmail.com');

-- 5. Check only ACTIVE form assignments
SELECT 
  fa.id as assignment_id,
  fa.status,
  fa.due_date,
  f.title as form_title,
  f.description
FROM form_assignments fa
JOIN forms f ON fa.form_id = f.id
WHERE fa.employee_id = (SELECT id FROM profiles WHERE email = 'tomws2984@gmail.com')
  AND f.is_active = true;

-- 6. Count forms by status
SELECT 
  f.is_active,
  fa.status,
  COUNT(*) as count
FROM form_assignments fa
JOIN forms f ON fa.form_id = f.id
WHERE fa.employee_id = (SELECT id FROM profiles WHERE email = 'tomws2984@gmail.com')
GROUP BY f.is_active, fa.status;

-- 7. List ALL active forms in the system (to see what's available)
SELECT 
  id,
  title,
  description,
  created_at,
  creator.email as created_by
FROM forms f
LEFT JOIN profiles creator ON f.created_by = creator.id
WHERE f.is_active = true
ORDER BY f.created_at DESC;

-- 8. Check if there are any form assignments at all for this user
SELECT 
  COUNT(*) as total_assignments,
  COUNT(CASE WHEN f.is_active THEN 1 END) as active_assignments,
  COUNT(CASE WHEN fa.status = 'pending' THEN 1 END) as pending_assignments,
  COUNT(CASE WHEN fa.status = 'completed' THEN 1 END) as completed_assignments
FROM form_assignments fa
LEFT JOIN forms f ON fa.form_id = f.id
WHERE fa.employee_id = (SELECT id FROM profiles WHERE email = 'tomws2984@gmail.com');

-- 9. Debug: Show all users and their form assignments (for comparison)
SELECT 
  p.email,
  COUNT(fa.id) as total_assignments,
  COUNT(CASE WHEN f.is_active AND fa.status = 'pending' THEN 1 END) as active_pending
FROM profiles p
LEFT JOIN form_assignments fa ON p.id = fa.employee_id
LEFT JOIN forms f ON fa.form_id = f.id
GROUP BY p.id, p.email
ORDER BY active_pending DESC;

/*
EXPECTED RESULTS:
- If user doesn't exist in auth.users: No authentication account
- If user doesn't exist in profiles: Need to create profile
- If no form assignments: Admin needs to assign forms
- If assignments exist but forms inactive: Admin needs to activate forms
- If active assignments exist: User should see forms (check app logic)
*/ 