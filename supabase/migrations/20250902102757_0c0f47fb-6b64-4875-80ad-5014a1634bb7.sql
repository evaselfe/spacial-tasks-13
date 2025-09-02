-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own daily notes" ON daily_notes;
DROP POLICY IF EXISTS "Users can create their own daily notes" ON daily_notes;
DROP POLICY IF EXISTS "Users can update their own daily notes" ON daily_notes;
DROP POLICY IF EXISTS "Users can delete their own daily notes" ON daily_notes;

-- Add mobile_number column and make user_id nullable
ALTER TABLE daily_notes 
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR,
ALTER COLUMN user_id DROP NOT NULL;

-- Create new RLS policies for mobile number access
CREATE POLICY "Agents can view their own daily notes by mobile" 
ON daily_notes 
FOR SELECT 
USING (mobile_number IS NOT NULL);

CREATE POLICY "Agents can create their own daily notes by mobile" 
ON daily_notes 
FOR INSERT 
WITH CHECK (mobile_number IS NOT NULL);

CREATE POLICY "Agents can update their own daily notes by mobile" 
ON daily_notes 
FOR UPDATE 
USING (mobile_number IS NOT NULL);

CREATE POLICY "Agents can delete their own daily notes by mobile" 
ON daily_notes 
FOR DELETE 
USING (mobile_number IS NOT NULL);

-- Create function to get agent info by mobile number
CREATE OR REPLACE FUNCTION get_agent_by_mobile(mobile_num VARCHAR)
RETURNS TABLE (
  agent_id UUID,
  agent_name VARCHAR,
  agent_type VARCHAR,
  panchayath_id UUID
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT id, name, 'coordinator'::VARCHAR, panchayath_id FROM coordinators WHERE mobile_number = mobile_num
  UNION ALL
  SELECT id, name, 'supervisor'::VARCHAR, panchayath_id FROM supervisors WHERE mobile_number = mobile_num
  UNION ALL
  SELECT id, name, 'group_leader'::VARCHAR, panchayath_id FROM group_leaders WHERE mobile_number = mobile_num
  UNION ALL
  SELECT id, name, 'pro'::VARCHAR, panchayath_id FROM pros WHERE mobile_number = mobile_num
$$;