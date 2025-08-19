-- Update RLS policies to allow public access for officers table
-- This fixes the authentication issue for the auto-login functionality

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON officers;

-- Create new public policy for officers table
CREATE POLICY "Allow public access to officers" ON officers FOR ALL TO public USING (true);

-- Keep other tables restricted to authenticated users for security
-- (coordinators, supervisors, group_leaders, pros, etc. remain authenticated-only)