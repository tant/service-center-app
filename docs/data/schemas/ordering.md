# Database Object Creation Order

This document defines the **correct order** for creating database objects based on dependencies.

## File Naming Convention

Files should be prefixed with a 3-digit number based on their category:
- **100-199**: ENUMs & SEQUENCES (base schema)
- **200-299**: TABLES & INDEXES
- **300-399**: CONSTRAINTS
- **400-499**: RELATIONSHIPS (Foreign Keys)
- **500-599**: FUNCTIONS
- **600-699**: TRIGGERS
- **700-799**: VIEWS
- **800-899**: POLICIES (RLS)
- **900-999**: GRANTS

## Order of Creation

### 1. ENUMs (Custom Types) & SEQUENCES (100-199)
- **MUST be first** - both are primitive objects with no dependencies
- **ENUMs**: tables use them as column types
  - Examples: `user_role`, `ticket_status`, `warehouse_type`, `product_condition`
- **SEQUENCES**: tables might use them for auto-increment
  - Examples: ticket numbering sequences
  - Typically created inline with tables or in base schema
- Files: `100_base_schema.sql`, `101_enums.sql`, `102_sequences.sql`

### 2. TABLES (structure only) & INDEXES (200-299)
- Create table definitions with columns
- Include inline constraints (NOT NULL, CHECK, UNIQUE)
- **INDEXES**: Created inline with table definitions or separately
  - Improve query performance on frequently queried columns
  - Can be created immediately after table definition
- **Do NOT add Foreign Keys yet** (other tables may not exist)
- Files: `200_users.sql`, `201_customers.sql`, `202_products.sql`, `203_tickets.sql`, etc.

### 3. CONSTRAINTS (separate from table definitions) (300-399)
- Add any additional CHECK or UNIQUE constraints
- Created after tables exist
- Examples: partial unique indexes, complex check constraints
- Files: `300_additional_constraints.sql`

### 4. RELATIONSHIPS (Foreign Keys) (400-499)
- **MUST be after all referenced tables exist**
- Examples: `products.brand_id REFERENCES brands(id)`
- Usually created inline with table definitions
- Can also be added via ALTER TABLE statements
- Files: `400_foreign_keys.sql`

### 5. FUNCTIONS (500-599)
- Created after tables exist (they often query tables)
- Helper functions, calculations, RLS functions
- Examples: `is_admin()`, `is_admin_or_manager()`, `calculate_total()`
- Files: `500_rls_functions.sql`, `501_helper_functions.sql`, `502_inventory_functions.sql`

### 6. TRIGGERS (600-699)
- **MUST be after both tables AND functions exist**
- Often call functions
- Examples: `update_updated_at_column` trigger, `generate_ticket_number()` trigger
- Created in table definition files or trigger-specific files
- Files: `600_common_triggers.sql`, `601_audit_triggers.sql`

### 7. VIEWS (700-799)
- **MUST be near last**
- Depend on tables, functions, and foreign keys
- Examples: `v_warehouse_stock_levels`, `v_task_progress_summary`
- Files: `700_reporting_views.sql`, `701_dashboard_views.sql`

### 8. POLICIES (RLS - Row Level Security) (800-899)
- Can be created after tables and functions
- Often reference functions like `is_admin()`, `is_staff()`
- Files: `800_rls_policies.sql`, `801_table_policies.sql`

### 9. GRANTS (Permissions) (900-999)
- Last - grant execute permissions on functions
- Example: `GRANT EXECUTE ON FUNCTION get_inventory_stats() TO authenticated`
- Usually at end of function definition files
- Files: `900_grants.sql`
