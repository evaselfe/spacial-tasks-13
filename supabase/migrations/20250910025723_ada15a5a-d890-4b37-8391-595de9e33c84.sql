-- Fix todos RLS policies - first drop all policies then recreate

-- Get all policy names and drop them
DROP POLICY IF EXISTS "Allow todo access for all users" ON todos;
DROP POLICY IF EXISTS "Users can create their own todos" ON todos;
DROP POLICY IF EXISTS "Users can view their own todos" ON todos; 
DROP POLICY IF EXISTS "Users can update their own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON todos;
DROP POLICY IF EXISTS "Allow inserts for all" ON todos;
DROP POLICY IF EXISTS "Allow todo inserts with proper user handling" ON todos;

-- Create simple policies that work for this use case
CREATE POLICY "Enable read access for all users" ON todos FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON todos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON todos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON todos FOR DELETE USING (true);