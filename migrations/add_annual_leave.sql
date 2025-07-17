-- Create annual leave table and enhanced time calculation
-- Migration: Add annual leave support

-- Create annual_leave table
CREATE TABLE IF NOT EXISTS annual_leave (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure start_date is before or equal to end_date
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_annual_leave_employee_id ON annual_leave(employee_id);
CREATE INDEX IF NOT EXISTS idx_annual_leave_dates ON annual_leave(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_annual_leave_status ON annual_leave(status);

-- Add RLS policies
ALTER TABLE annual_leave ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own leave records
CREATE POLICY "Users can view own annual leave" ON annual_leave
  FOR SELECT USING (employee_id = auth.uid());

-- Policy: Users can insert their own leave records
CREATE POLICY "Users can insert own annual leave" ON annual_leave
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- Policy: Users can update their own leave records
CREATE POLICY "Users can update own annual leave" ON annual_leave
  FOR UPDATE USING (employee_id = auth.uid());

-- Policy: Users can delete their own leave records
CREATE POLICY "Users can delete own annual leave" ON annual_leave
  FOR DELETE USING (employee_id = auth.uid());

-- Function to check if a user is on annual leave for a given date
CREATE OR REPLACE FUNCTION is_user_on_leave(user_id UUID, check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM annual_leave 
    WHERE employee_id = user_id 
      AND status = 'approved'
      AND start_date <= check_date 
      AND end_date >= check_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate effective status considering annual leave
CREATE OR REPLACE FUNCTION get_form_status_with_leave(
  assignment_id UUID,
  employee_id UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  current_status TEXT
)
RETURNS TEXT AS $$
DECLARE
  is_on_leave BOOLEAN;
BEGIN
  -- If already completed, return as is
  IF current_status = 'completed' THEN
    RETURN current_status;
  END IF;
  
  -- Check if user is on approved leave during the due date
  SELECT is_user_on_leave(employee_id, due_date::DATE) INTO is_on_leave;
  
  -- If on leave and past due date, return 'pending' instead of 'overdue'
  IF is_on_leave AND due_date < NOW() THEN
    RETURN 'on_leave';
  END IF;
  
  -- If past due date and not on leave, return overdue
  IF due_date < NOW() AND current_status != 'completed' THEN
    RETURN 'overdue';
  END IF;
  
  -- Otherwise return current status
  RETURN current_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_annual_leave_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_annual_leave_updated_at
  BEFORE UPDATE ON annual_leave
  FOR EACH ROW
  EXECUTE FUNCTION update_annual_leave_updated_at();

-- Add some example data (optional - remove in production)
-- INSERT INTO annual_leave (employee_id, start_date, end_date, status, reason)
-- VALUES 
--   ((SELECT id FROM profiles WHERE email = 'tomws2984@gmail.com'), '2024-12-20', '2024-12-30', 'approved', 'Christmas holiday');

COMMENT ON TABLE annual_leave IS 'Stores employee annual leave periods';
COMMENT ON FUNCTION is_user_on_leave IS 'Check if a user is on approved annual leave for a specific date';
COMMENT ON FUNCTION get_form_status_with_leave IS 'Calculate form status considering annual leave periods'; 