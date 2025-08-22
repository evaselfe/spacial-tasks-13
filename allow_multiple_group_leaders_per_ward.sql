-- Remove unique constraint that limits one group leader per ward
-- This allows multiple group leaders (up to 2) per ward in each panchayath

-- Drop the existing unique constraint
ALTER TABLE group_leaders DROP CONSTRAINT IF EXISTS group_leaders_panchayath_id_ward_key;

-- Optional: Add a check to limit maximum 2 group leaders per ward per panchayath
-- This creates a function and trigger to enforce the limit
CREATE OR REPLACE FUNCTION check_max_group_leaders_per_ward()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if adding this group leader would exceed 2 per ward
    IF (SELECT COUNT(*) 
        FROM group_leaders 
        WHERE panchayath_id = NEW.panchayath_id 
        AND ward = NEW.ward 
        AND (TG_OP = 'INSERT' OR id != NEW.id)) >= 2 THEN
        RAISE EXCEPTION 'Maximum 2 group leaders allowed per ward';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the limit
DROP TRIGGER IF EXISTS enforce_max_group_leaders_per_ward ON group_leaders;
CREATE TRIGGER enforce_max_group_leaders_per_ward
    BEFORE INSERT OR UPDATE ON group_leaders
    FOR EACH ROW
    EXECUTE FUNCTION check_max_group_leaders_per_ward();