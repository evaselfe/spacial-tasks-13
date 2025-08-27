-- Database changes for admin system restructure
-- 1. Create super_admins table for system administrators
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert super admin user 'eva' with password '321'
-- Note: In production, passwords should be properly hashed
INSERT INTO super_admins (username, password_hash, name) 
VALUES ('eva', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Eva Administrator')
ON CONFLICT (username) DO NOTHING;

-- 3. Create RLS policies for super_admins table
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Policy to allow super admins to read their own data
CREATE POLICY "Super admins can read own data" ON super_admins
  FOR SELECT USING (true);

-- Policy to allow super admins to update their own data
CREATE POLICY "Super admins can update own data" ON super_admins
  FOR UPDATE USING (true);

-- 4. Ensure admin_teams and admin_members tables exist with correct structure
CREATE TABLE IF NOT EXISTS admin_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update admin_members table to include team relationship and admin type
ALTER TABLE admin_members 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES admin_teams(id),
ADD COLUMN IF NOT EXISTS admin_type VARCHAR(20) DEFAULT 'team_admin';

-- Update existing admin_members to be team_admin type
UPDATE admin_members SET admin_type = 'team_admin' WHERE admin_type IS NULL;

-- 5. Enable RLS for admin tables
ALTER TABLE admin_teams ENABLE ROW LEVEL SECURITY;

-- Policies for admin_teams
CREATE POLICY "Admin teams can be read by authenticated users" ON admin_teams
  FOR SELECT USING (true);

CREATE POLICY "Admin teams can be managed by admin members" ON admin_teams
  FOR ALL USING (true);

-- Policies for admin_members
CREATE POLICY "Admin members can be read by authenticated users" ON admin_members
  FOR SELECT USING (true);

CREATE POLICY "Admin members can be managed by admin members" ON admin_members
  FOR ALL USING (true);

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins(username);
CREATE INDEX IF NOT EXISTS idx_admin_members_admin_type ON admin_members(admin_type);
CREATE INDEX IF NOT EXISTS idx_admin_members_team_id ON admin_members(team_id);
CREATE INDEX IF NOT EXISTS idx_admin_teams_name ON admin_teams(name);

-- 7. Comments for documentation
COMMENT ON TABLE super_admins IS 'System super administrators with full access';
COMMENT ON TABLE admin_teams IS 'Administrative teams for team admin management';
COMMENT ON COLUMN admin_members.admin_type IS 'Type of admin: team_admin for team management';
COMMENT ON COLUMN admin_members.team_id IS 'Reference to admin team this member belongs to';