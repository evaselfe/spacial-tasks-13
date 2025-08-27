-- Admin Teams and Members Database Schema

-- Admin Teams Table
CREATE TABLE IF NOT EXISTS admin_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Members Table
CREATE TABLE IF NOT EXISTS admin_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES admin_teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    panchayath VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Team member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_members_team_id ON admin_members(team_id);
CREATE INDEX IF NOT EXISTS idx_admin_members_mobile ON admin_members(mobile);
CREATE INDEX IF NOT EXISTS idx_admin_members_panchayath ON admin_members(panchayath);

-- RLS Policies (Enable RLS)
ALTER TABLE admin_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_members ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on admin_teams for authenticated users" ON admin_teams
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations on admin_members for authenticated users" ON admin_members
    FOR ALL USING (auth.role() = 'authenticated');

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_teams_updated_at 
    BEFORE UPDATE ON admin_teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_members_updated_at 
    BEFORE UPDATE ON admin_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();