# Task Management Database Documentation

## Database Schema Overview

This database supports a hierarchical task management system for panchayaths with the following structure:

**Hierarchy:** PRO → Group Leader → Supervisor → Coordinator

## Tables Structure

### 1. officers
- Stores officer login credentials (name + mobile for auto-login)
- Primary key: `id` (UUID)
- Unique constraint on `mobile_number`

### 2. panchayaths
- Stores panchayath basic information
- Fields: `name`, `number_of_wards`, `created_by`
- References: `created_by` → `officers.id`

### 3. coordinators (Top Level)
- One coordinator per ward per panchayath
- Fields: `name`, `mobile_number`, `ward`, `rating` (0-10)
- References: `panchayath_id` → `panchayaths.id`
- Unique constraint: `(panchayath_id, ward)`

### 4. supervisors
- Multiple supervisors per coordinator
- Can supervise multiple wards
- Fields: `name`, `mobile_number`
- References: `coordinator_id` → `coordinators.id`

### 5. supervisor_wards
- Junction table for supervisor-ward many-to-many relationship
- References: `supervisor_id` → `supervisors.id`

### 6. group_leaders
- One group leader per ward
- Reports to supervisor of that ward
- Fields: `name`, `mobile_number`, `ward`
- References: `supervisor_id` → `supervisors.id`

### 7. pros (Bottom Level)
- Multiple PROs can report to one group leader
- Fields: `name`, `mobile_number`, `ward`
- References: `group_leader_id` → `group_leaders.id`

## Views

### hierarchy_view
- Provides complete hierarchy information in a single query
- Shows all relationships from panchayath down to PRO level
- Includes supervisor ward assignments as arrays

## Key Features

1. **UUID Primary Keys**: All tables use UUID for better distribution and security
2. **Timestamps**: Auto-managed `created_at` and `updated_at` fields
3. **Indexes**: Optimized for common query patterns
4. **Constraints**: Data integrity ensured through foreign keys and check constraints
5. **RLS Policies**: Row Level Security enabled for Supabase integration
6. **Triggers**: Automatic `updated_at` timestamp management

## Common Queries

### Get hierarchy for a panchayath:
```sql
SELECT * FROM hierarchy_view WHERE panchayath_name = 'Your Panchayath';
```

### Get supervisors for a specific ward:
```sql
SELECT s.* FROM supervisors s
JOIN supervisor_wards sw ON s.id = sw.supervisor_id
WHERE sw.ward = 5;
```

### Get group leaders under a supervisor:
```sql
SELECT gl.* FROM group_leaders gl
WHERE gl.supervisor_id = 'supervisor-uuid-here';
```

## Setup Instructions

1. Run the SQL script in your PostgreSQL/Supabase database
2. The script will create all tables, indexes, triggers, and policies
3. Optionally insert sample data using the commented INSERT statements
4. For Supabase, the RLS policies are already configured for authenticated users