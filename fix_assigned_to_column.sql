-- Comprehensive fix for assigned_to column
-- This script ensures the column exists and is properly configured

-- First, check if the column exists and add it if not
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todos' 
        AND table_schema = 'public' 
        AND column_name = 'assigned_to'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.todos 
        ADD COLUMN assigned_to UUID REFERENCES public.admin_members(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Column assigned_to added to todos table';
    ELSE
        RAISE NOTICE 'Column assigned_to already exists in todos table';
    END IF;
END $$;

-- Ensure the index exists
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON public.todos(assigned_to);

-- Add helpful comment
COMMENT ON COLUMN public.todos.assigned_to IS 'References admin_members.id - the team member assigned to this task';

-- Verify the column was added correctly
DO $$
BEGIN
    -- Check if column exists and has correct type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todos' 
        AND table_schema = 'public' 
        AND column_name = 'assigned_to'
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE 'SUCCESS: assigned_to column is properly configured';
    ELSE
        RAISE EXCEPTION 'ERROR: assigned_to column was not created properly';
    END IF;
END $$;

-- Optional: Check if admin_members table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_members' AND table_schema = 'public') THEN
        RAISE WARNING 'admin_members table does not exist. Please create it first.';
    END IF;
END $$;