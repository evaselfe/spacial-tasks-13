-- Fix RLS policies for coordinators table to allow UPDATE operations
DROP POLICY IF EXISTS "Allow anon update coordinators" ON coordinators;

CREATE POLICY "Allow anon update coordinators" 
ON coordinators 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Also add DELETE policy for completeness
DROP POLICY IF EXISTS "Allow anon delete coordinators" ON coordinators;

CREATE POLICY "Allow anon delete coordinators" 
ON coordinators 
FOR DELETE 
USING (true);