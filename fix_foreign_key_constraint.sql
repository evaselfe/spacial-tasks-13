-- Fix the foreign key constraint for assigned_to column
-- The column exists but references the wrong table (users instead of admin_members)

-- First, drop the incorrect foreign key constraint
ALTER TABLE public.todos 
DROP CONSTRAINT IF EXISTS todos_assigned_to_fkey;

-- Ensure the column exists (in case it doesn't)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todos' 
        AND table_schema = 'public' 
        AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE public.todos 
        ADD COLUMN assigned_to UUID;
    END IF;
END $$;

-- Add the correct foreign key constraint referencing admin_members
ALTER TABLE public.todos 
ADD CONSTRAINT todos_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.admin_members(id) ON DELETE SET NULL;

-- Ensure the index exists for performance
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON public.todos(assigned_to);

-- Add helpful comment
COMMENT ON COLUMN public.todos.assigned_to IS 'References admin_members.id - the team member assigned to this task';

-- Verify the constraint is correct
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'todos' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'assigned_to'
        AND ccu.table_name = 'admin_members'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'SUCCESS: Foreign key constraint properly references admin_members table';
    ELSE
        RAISE EXCEPTION 'ERROR: Foreign key constraint was not created properly';
    END IF;
END $$;