-- Add assigned_to column to todos table to support team member assignment
-- This allows tasks to be assigned to admin team members

-- Add the column
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES admin_members(id) ON DELETE SET NULL;

-- Add index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON todos(assigned_to);

-- Add comment for documentation
COMMENT ON COLUMN todos.assigned_to IS 'References admin_members.id - the team member assigned to this task';