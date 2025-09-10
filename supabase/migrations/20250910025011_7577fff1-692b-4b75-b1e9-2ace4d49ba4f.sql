-- Fix RLS policy conflict for todos table
-- Remove conflicting INSERT policies and create proper ones

-- Drop the conflicting policies
DROP POLICY IF EXISTS "Users can create their own todos" ON todos;
DROP POLICY IF EXISTS "Allow inserts for all" ON todos;

-- Create a single, clear INSERT policy that handles both authenticated and anonymous users
CREATE POLICY "Allow todo inserts with proper user handling" 
ON todos 
FOR INSERT 
WITH CHECK (
  -- Allow insert if user is authenticated and created_by matches auth.uid()
  (auth.uid() IS NOT NULL AND auth.uid() = created_by) OR
  -- Allow insert if no authentication is required (created_by can be null)
  (auth.uid() IS NULL AND created_by IS NULL)
);