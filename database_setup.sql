-- Task Management Database Setup
-- This SQL script creates all necessary tables for the panchayath task management system

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Officers table (for auto-login)
CREATE TABLE officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(10) UNIQUE NOT NULL CHECK (mobile_number ~ '^\d{10}$'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Panchayaths table
CREATE TABLE panchayaths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    number_of_wards INTEGER NOT NULL CHECK (number_of_wards > 0),
    created_by UUID REFERENCES officers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coordinators table (top level)
CREATE TABLE coordinators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panchayath_id UUID NOT NULL REFERENCES panchayaths(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(10) UNIQUE NOT NULL CHECK (mobile_number ~ '^\d{10}$'),
    ward INTEGER NOT NULL,
    rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(panchayath_id, ward)
);

-- Supervisors table
CREATE TABLE supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panchayath_id UUID NOT NULL REFERENCES panchayaths(id) ON DELETE CASCADE,
    coordinator_id UUID NOT NULL REFERENCES coordinators(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(10) UNIQUE NOT NULL CHECK (mobile_number ~ '^\d{10}$'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supervisor wards mapping (many-to-many relationship)
CREATE TABLE supervisor_wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
    ward INTEGER NOT NULL,
    UNIQUE(supervisor_id, ward)
);

-- Group leaders table
CREATE TABLE group_leaders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panchayath_id UUID NOT NULL REFERENCES panchayaths(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES supervisors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(10) UNIQUE NOT NULL CHECK (mobile_number ~ '^\d{10}$'),
    ward INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(panchayath_id, ward)
);

-- PROs table (bottom level)
CREATE TABLE pros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panchayath_id UUID NOT NULL REFERENCES panchayaths(id) ON DELETE CASCADE,
    group_leader_id UUID NOT NULL REFERENCES group_leaders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(10) UNIQUE NOT NULL CHECK (mobile_number ~ '^\d{10}$'),
    ward INTEGER NOT NULL,  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_officers_mobile ON officers(mobile_number);
CREATE INDEX idx_panchayaths_name ON panchayaths(name);
CREATE INDEX idx_coordinators_panchayath ON coordinators(panchayath_id);
CREATE INDEX idx_coordinators_ward ON coordinators(ward);
CREATE INDEX idx_supervisors_coordinator ON supervisors(coordinator_id);
CREATE INDEX idx_supervisors_panchayath ON supervisors(panchayath_id);
CREATE INDEX idx_supervisor_wards_supervisor ON supervisor_wards(supervisor_id);
CREATE INDEX idx_group_leaders_supervisor ON group_leaders(supervisor_id);
CREATE INDEX idx_group_leaders_ward ON group_leaders(ward);
CREATE INDEX idx_pros_group_leader ON pros(group_leader_id);
CREATE INDEX idx_pros_ward ON pros(ward);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON officers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_panchayaths_updated_at BEFORE UPDATE ON panchayaths 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coordinators_updated_at BEFORE UPDATE ON coordinators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervisors_updated_at BEFORE UPDATE ON supervisors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_leaders_updated_at BEFORE UPDATE ON group_leaders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pros_updated_at BEFORE UPDATE ON pros 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for easy hierarchy viewing
CREATE VIEW hierarchy_view AS
SELECT 
    p.name as panchayath_name,
    p.number_of_wards,
    c.name as coordinator_name,
    c.mobile_number as coordinator_mobile,
    c.ward as coordinator_ward,
    c.rating as coordinator_rating,
    s.name as supervisor_name,
    s.mobile_number as supervisor_mobile,
    array_agg(DISTINCT sw.ward) as supervisor_wards,
    gl.name as group_leader_name,
    gl.mobile_number as group_leader_mobile,
    gl.ward as group_leader_ward,
    pr.name as pro_name,
    pr.mobile_number as pro_mobile,
    pr.ward as pro_ward
FROM panchayaths p
LEFT JOIN coordinators c ON p.id = c.panchayath_id
LEFT JOIN supervisors s ON c.id = s.coordinator_id
LEFT JOIN supervisor_wards sw ON s.id = sw.supervisor_id
LEFT JOIN group_leaders gl ON s.id = gl.supervisor_id
LEFT JOIN pros pr ON gl.id = pr.group_leader_id
GROUP BY p.id, p.name, p.number_of_wards, c.id, c.name, c.mobile_number, c.ward, c.rating,
         s.id, s.name, s.mobile_number, gl.id, gl.name, gl.mobile_number, gl.ward,
         pr.id, pr.name, pr.mobile_number, pr.ward
ORDER BY p.name, c.ward, gl.ward;

-- Row Level Security (RLS) policies (if using Supabase)
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE panchayaths ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pros ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON officers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON panchayaths FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON coordinators FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON supervisors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON supervisor_wards FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON group_leaders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON pros FOR ALL TO authenticated USING (true);

-- Sample data insertion (optional)
-- INSERT INTO officers (name, mobile_number) VALUES 
-- ('Admin User', '9999999999');

-- INSERT INTO panchayaths (name, number_of_wards, created_by) VALUES 
-- ('Sample Panchayath', 10, (SELECT id FROM officers WHERE mobile_number = '9999999999'));