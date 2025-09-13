-- Add reassigned_to column to todos table to support coordinator/supervisor reassignment
-- This allows tasks to be reassigned to coordinators or supervisors while keeping original team member assignment

-- Add the reassigned_to column for coordinators
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS reassigned_to_coordinator UUID REFERENCES coordinators(id) ON DELETE SET NULL;

-- Add the reassigned_to column for supervisors  
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS reassigned_to_supervisor UUID REFERENCES supervisors(id) ON DELETE SET NULL;

-- Add indexes for better performance on queries
CREATE INDEX IF NOT EXISTS idx_todos_reassigned_coordinator ON todos(reassigned_to_coordinator);
CREATE INDEX IF NOT EXISTS idx_todos_reassigned_supervisor ON todos(reassigned_to_supervisor);

-- Add comments for documentation
COMMENT ON COLUMN todos.reassigned_to_coordinator IS 'References coordinators.id - the coordinator this task is reassigned to';
COMMENT ON COLUMN todos.reassigned_to_supervisor IS 'References supervisors.id - the supervisor this task is reassigned to';

-- Verify the columns were added correctly
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todos' 
        AND table_schema = 'public' 
        AND column_name = 'reassigned_to_coordinator'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todos' 
        AND table_schema = 'public' 
        AND column_name = 'reassigned_to_supervisor'  
    ) THEN
        RAISE NOTICE 'SUCCESS: reassigned_to columns are properly configured';
    ELSE
        RAISE EXCEPTION 'ERROR: reassigned_to columns were not created properly';
    END IF;
END $$;