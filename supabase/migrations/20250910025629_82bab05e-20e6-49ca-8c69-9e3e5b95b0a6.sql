-- Fix todos table RLS policies to allow proper access
-- Remove existing conflicting policies and create comprehensive ones

-- Drop all existing policies for todos
DROP POLICY IF EXISTS "Allow todo inserts with proper user handling" ON todos;
DROP POLICY IF EXISTS "Users can view their own todos" ON todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON todos;

-- Create comprehensive policies that handle both authenticated and anonymous users
CREATE POLICY "Allow todo access for all users" ON todos FOR ALL 
USING (
  -- Allow access if user is authenticated and owns the todo
  (auth.uid() IS NOT NULL AND auth.uid() = created_by) OR
  -- Allow access if no authentication and created_by is null
  (auth.uid() IS NULL AND created_by IS NULL) OR
  -- Allow access for todos with null created_by regardless of auth state
  (created_by IS NULL)
)
WITH CHECK (
  -- Same conditions for inserts/updates
  (auth.uid() IS NOT NULL AND auth.uid() = created_by) OR
  (auth.uid() IS NULL AND created_by IS NULL) OR
  (created_by IS NULL)
);