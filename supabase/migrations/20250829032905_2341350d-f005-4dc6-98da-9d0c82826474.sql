-- Update existing testimonial_responses to link them to correct agent_id based on mobile number
-- Update for supervisors
UPDATE testimonial_responses 
SET agent_id = (
  SELECT s.id 
  FROM supervisors s 
  WHERE s.mobile_number = testimonial_responses.respondent_contact
)
WHERE agent_type = 'supervisor' 
AND agent_id IS NULL 
AND respondent_contact IS NOT NULL;

-- Update for coordinators  
UPDATE testimonial_responses 
SET agent_id = (
  SELECT c.id 
  FROM coordinators c 
  WHERE c.mobile_number = testimonial_responses.respondent_contact
)
WHERE agent_type = 'coordinator' 
AND agent_id IS NULL 
AND respondent_contact IS NOT NULL;

-- Update for group_leaders
UPDATE testimonial_responses 
SET agent_id = (
  SELECT gl.id 
  FROM group_leaders gl 
  WHERE gl.mobile_number = testimonial_responses.respondent_contact
)
WHERE agent_type = 'group_leader' 
AND agent_id IS NULL 
AND respondent_contact IS NOT NULL;

-- Update for pros
UPDATE testimonial_responses 
SET agent_id = (
  SELECT p.id 
  FROM pros p 
  WHERE p.mobile_number = testimonial_responses.respondent_contact
)
WHERE agent_type = 'pro' 
AND agent_id IS NULL 
AND respondent_contact IS NOT NULL;

-- Update for admin_members
UPDATE testimonial_responses 
SET agent_id = (
  SELECT am.id 
  FROM admin_members am 
  WHERE am.mobile = testimonial_responses.respondent_contact
)
WHERE agent_type = 'admin_member' 
AND agent_id IS NULL 
AND respondent_contact IS NOT NULL;