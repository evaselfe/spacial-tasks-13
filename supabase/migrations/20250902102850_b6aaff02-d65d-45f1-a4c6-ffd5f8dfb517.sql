-- Add mobile_number column and make user_id nullable
ALTER TABLE daily_notes 
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR,
ALTER COLUMN user_id DROP NOT NULL;

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