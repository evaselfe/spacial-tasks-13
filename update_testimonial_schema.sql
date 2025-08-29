-- Update testimonial_responses table to allow admin_member as agent_type
ALTER TABLE testimonial_responses DROP CONSTRAINT IF EXISTS testimonial_responses_agent_type_check;

-- Add new constraint that includes admin_member
ALTER TABLE testimonial_responses 
ADD CONSTRAINT testimonial_responses_agent_type_check 
CHECK (agent_type IN ('coordinator', 'supervisor', 'group_leader', 'pro', 'admin_member'));

-- Update the testimonial form interface type as well by modifying the existing table comment
COMMENT ON COLUMN testimonial_responses.agent_type IS 'Type of agent: coordinator, supervisor, group_leader, pro, admin_member';