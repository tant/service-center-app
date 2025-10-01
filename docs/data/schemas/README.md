# Service Center Database Schema

This directory contains the complete database schema for the Service Center application, designed for use with Supabase. The schemas are structured to follow Supabase's declarative schema approach for easy migration management.

## Schema Management Strategy

**This project uses Supabase's Declarative Schema approach (Option 2):**

- **Source of Truth**: Schema files in `docs/data/schemas/` serve as documentation and master templates
- **Working Directory**: Schema files are copied to `supabase/schemas/` for declarative schema management
- **Migration Generation**: Supabase CLI automatically generates migrations by comparing declared schemas with database state
- **Benefits**: Single source of truth, automatic migration generation, better schema organization
- **Workflow**: Edit schemas in `docs/` → Copy to `supabase/schemas/` → Generate migrations → Apply changes

This hybrid approach gives us the best of both worlds: well-documented schemas in our docs directory and the power of Supabase's declarative schema management.

## Schema Files Overview

The schema files are organized by type and numbered to ensure proper creation order due to foreign key dependencies:

### Base Functions
- **00_base_functions.sql** - Common functions used across all tables (must run first)

### Core Tables
1. **core_01_profiles.sql** - User profiles and role management
2. **core_02_customers.sql** - Customer information management
3. **core_03_products.sql** - Product catalog
4. **core_04_parts.sql** - Replacement parts inventory
5. **core_05_product_parts.sql** - Product-to-parts mapping (junction table)
6. **core_06_service_tickets.sql** - Main service ticket workflow
7. **core_07_service_ticket_parts.sql** - Parts used in service tickets
8. **core_08_service_ticket_comments.sql** - Comments and communication history

### Functions
- **functions_inventory.sql** - Inventory management functions (stock increase/decrease)

### Storage
- **storage_policies.sql** - Storage bucket RLS policies for file uploads (avatars, product images, service media)

## Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   auth.users│────│   profiles  │    │  customers  │
│             │    │             │    │             │
│ - id        │    │ - user_id   │    │ - id        │
│ - email     │    │ - full_name │    │ - name      │
│ - ...       │    │ - roles[]   │    │ - phone     │
└─────────────┘    │ - is_active │    │ - email     │
     (Supabase)    └─────────────┘    │ - address   │
                           │           └─────────────┘
                           │                  │
                           ▼                  │
                    ┌─────────────┐          │
                    │  products   │          │
                    │             │          │
                    │ - id        │          │
                    │ - name      │          │
                    │ - sku       │          │
                    │ - brand     │          │
                    │ - model     │          │
                    └─────────────┘          │
                           │                  │
                           ▼                  │
                    ┌─────────────┐          │
                    │    parts    │          │
                    │             │          │
                    │ - id        │          │
                    │ - product_id│          │
                    │ - name      │          │
                    │ - price     │          │
                    └─────────────┘          │
                           │                  │
                           │                  ▼
    ┌─────────────┐       │           ┌─────────────┐
    │   profiles  │───────┼──────────▶│service_tickets│
    │   (refs)    │       │           │             │
    └─────────────┘       │           │ - id        │
           │               │           │ - ticket_#  │
           │               │           │ - customer_id│
           │               │           │ - product_id│
           │               │           │ - status    │
           │               │           │ - parts_total│
           │               │           │ - total_cost│
           │               │           └─────────────┘
           │               │                  │
           │               │                  ├─────────────┐
           │               │                  │             │
           ▼               ▼                  ▼             ▼
    ┌─────────────┐ ┌─────────────────┐ ┌─────────────────────┐
    │service_ticket│ │ service_ticket_ │ │ service_ticket_     │
    │  _comments   │ │     parts       │ │    comments        │
    │              │ │                 │ │                    │
    │ - ticket_id  │ │ - ticket_id     │ │ - ticket_id        │
    │ - user_id    │ │ - part_id       │ │ - user_id          │
    │ - comment    │ │ - quantity      │ │ - comment_text     │
    │ - type       │ │ - unit_price    │ │ - comment_type     │
    │ - is_internal│ │ - total_price   │ │ - is_internal      │
    └─────────────┘ └─────────────────┘ └─────────────────────┘
```

## Key Features

### 1. Authentication & Authorization
- Integrates with Supabase Auth (`auth.users`)
- Role-based access control via `profiles.roles[]`
- Row Level Security (RLS) policies for data protection

### 2. Business Logic Automation
- **Ticket numbering**: Auto-generated unique ticket numbers (SV-YYYY-NNN format)
- **Cost calculation**: Automatic total cost calculation from parts + service fees
- **Status tracking**: Automatic comment logging for status changes
- **Parts inventory**: Real-time parts total calculation in service tickets

### 3. Audit Trail
- All tables include `created_at`, `updated_at` timestamps
- Creator/modifier tracking with `created_by`, `updated_by` fields
- Immutable comment system for complete history
- Automatic status change logging

### 4. Data Integrity
- Foreign key constraints with appropriate cascade/restrict rules
- Check constraints for data validation
- Unique constraints where business rules require
- Comprehensive indexing for performance

## Declarative Schema Migration Workflow

This project uses Supabase's **declarative schema** approach, where you define the desired end state of your database schema rather than writing individual migration steps. The CLI automatically generates the necessary migration files by comparing your declared schemas with the current database state.

### 🚀 Quick Setup (Recommended)
```bash
# Use the automated setup script
./docs/data/schemas/setup_schema.sh
```

### 📋 Manual Workflow

#### 1. Initial Setup
```bash
# Start local Supabase (if not running)
supabase start

# Copy schema files to supabase/schemas/
cp docs/data/schemas/*.sql supabase/schemas/

# Generate initial migration from schemas
supabase db diff -f initial_service_center_schema

# Review the generated migration
cat supabase/migrations/*_initial_service_center_schema.sql

# Apply migration to local database
supabase migration up
```

#### 2. Making Schema Changes
```bash
# 1. Edit schema files in docs/data/schemas/ (source of truth)
vim docs/data/schemas/05_service_tickets.sql

# 2. Copy updated schemas to supabase/
cp docs/data/schemas/*.sql supabase/schemas/

# 3. Generate incremental migration
supabase db diff -f add_new_ticket_field

# 4. Review generated migration
cat supabase/migrations/*_add_new_ticket_field.sql

# 5. Apply migration locally
supabase migration up

# 6. Test your changes in the local dashboard
# Visit the URL shown by 'supabase status'
```

#### 3. Production Deployment
```bash
# 1. Login to Supabase CLI
supabase login

# 2. Link your remote project
supabase link --project-ref your-project-ref

# 3. Push changes to production
supabase db push

# Alternative: Deploy specific migration
# supabase migration up --db-url "your-production-url"
```

### 🔄 Development Best Practices

#### Schema File Organization
Our schemas are organized by prefix and numbered to ensure proper dependency order:

**Base Functions** (prefix: `00_`)
- `00_base_functions.sql` - Common functions (update_updated_at_column)

**Core Tables** (prefix: `core_`)
- `core_01_profiles.sql` - User management (depends on auth.users)
- `core_02_customers.sql` - Customer data
- `core_03_products.sql` - Product catalog
- `core_04_parts.sql` - Parts inventory
- `core_05_product_parts.sql` - Product-to-parts mapping (depends on products, parts)
- `core_06_service_tickets.sql` - Service tickets (depends on customers, products, profiles)
- `core_07_service_ticket_parts.sql` - Junction table (depends on service_tickets, parts)
- `core_08_service_ticket_comments.sql` - Comments (depends on service_tickets, profiles)

**Functions** (prefix: `functions_`)
- `functions_inventory.sql` - Inventory management (depends on parts table)

**Storage** (prefix: `storage_`)
- `storage_policies.sql` - Storage bucket RLS policies for file uploads

#### Schema Execution Order
The `setup_schema.sh` script automatically copies files in the correct order:
1. Base functions first (00_base_functions.sql)
2. Core tables in dependency order (core_01 through core_08)
3. Additional functions (functions_inventory.sql)
4. Storage policies (storage_policies.sql)

#### Column Addition Best Practices
When adding new columns, always append to the end of tables to avoid messy diffs:
```sql
-- ✅ Good: Add new columns at the end
create table "service_tickets" (
  "id" uuid not null default gen_random_uuid(),
  "customer_id" uuid not null,
  -- ... existing columns ...
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- ✅ New columns go here
  "priority_score" integer default 0
);

-- ❌ Avoid: Adding columns in the middle creates messy diffs
```

### 🛠️ Advanced Operations

#### Rolling Back During Development
```bash
# Reset to a specific migration version (local only)
supabase db reset --version 20241005112233

# After reset, edit schemas and regenerate migration
supabase db diff -f updated_schema
supabase migration up
```

#### Pulling Production Schema
```bash
# Import existing production schema
supabase db dump > supabase/schemas/production.sql

# Break down into modular files as needed
# Then generate migrations incrementally
```

#### Clean Development Cycle
```bash
# Reset database and reapply all schemas
pnpx supabase db reset

# Setup from scratch
./docs/data/schemas/setup_schema.sh
```

### 🔍 Migration Verification

#### Before Applying Migrations
```bash
# 1. Review generated SQL
cat supabase/migrations/*_your_migration.sql

# 2. Check migration is incremental (single logical change)
# 3. Verify no unexpected destructive operations
# 4. Test on local database first
supabase migration up
```

#### After Migration
```bash
# Verify schema state
supabase db diff

# Should show "No changes detected" if successful
# Check local dashboard for expected changes
supabase status
```

### ⚠️ Important Limitations

The declarative schema approach works great for most changes, but has some limitations:

#### Not Captured by Schema Diff
- **Data changes** (INSERT, UPDATE, DELETE statements)
- **View ownership** and complex grants
- **RLS policy alterations** (may need manual migrations)
- **Comments** on tables/columns
- **Partitioned tables**

#### For Complex Changes
Use traditional migrations for:
```bash
# Create a manual migration file
supabase migration new complex_data_migration

# Edit the file with your custom SQL
vim supabase/migrations/*_complex_data_migration.sql

# Apply the migration
supabase migration up
```

### 🚀 Production Deployment Checklist

Before deploying to production:

1. **Test Locally**
   - [ ] All migrations apply successfully
   - [ ] No data loss in test scenarios
   - [ ] RLS policies work as expected
   - [ ] Application still functions correctly

2. **Review Changes**
   - [ ] Migration files contain only expected changes
   - [ ] No destructive operations without backup plan
   - [ ] Performance impact assessed

3. **Deploy Safely**
   - [ ] Database backup taken
   - [ ] Deploy during low-traffic window
   - [ ] Monitor application after deployment
   - [ ] Rollback plan prepared

4. **Post-Deployment**
   - [ ] Verify schema changes in production
   - [ ] Test critical application flows
   - [ ] Monitor for any issues

### 🔧 Troubleshooting Common Issues

#### "No changes detected" when expecting changes
```bash
# Ensure schemas are copied to supabase/schemas/
ls -la supabase/schemas/

# Check if local database matches schemas
supabase db diff --schema-only

# Reset and reapply if needed
supabase db reset
supabase migration up
```

####### Migration conflicts or errors
```bash
# Check current migration status
pnpx supabase migration list

# Reset to specific version
pnpx supabase db reset --version <timestamp>

# Or clean start
pnpx supabase db reset
./docs/data/schemas/setup_schema.sh
```

## Security & Access Control

### Row Level Security (RLS) Implementation

All tables have RLS enabled with role-based policies.

#### Role-Based Access:
- **Admins**: Full access to all data
- **Managers**: Access to customers, products, and service tickets  
- **Technicians**: Access to tickets assigned to them
- **Reception**: Create/view tickets and customer information
- **Service tickets**: Accessible only to assigned technicians or management

#### RLS policies not working
```bash
# Check policy syntax in schema files
# Test with different user contexts
# Consider using supabase dashboard for RLS testing
```

#### Functions or triggers not updating
```bash
# Functions and triggers are recreated entirely
# Make sure complete function definition is in schema file
# Check for syntax errors in generated migration
```

### 📚 Additional Resources

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Database Migrations Guide](https://supabase.com/docs/guides/deployment/database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Local Development](https://supabase.com/docs/guides/local-development)

## Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only access data they're authorized to see
- Role-based permissions (admin, manager, technician, reception)
- Service tickets are accessible only to assigned technicians or management

### Data Validation
- Phone number format validation
- Email format validation
- Price and quantity constraints (positive values)
- Status and enum value validation

## Performance Optimizations

### Indexing Strategy
- Primary keys and foreign keys are automatically indexed
- Business-critical search fields (phone, email, ticket_number)
- Composite indexes for common query patterns
- Partial indexes for filtered queries (e.g., active profiles only)

### Query Optimization
- Views for common joins (comments with author info)
- Materialized views can be added for heavy reporting queries
- Proper cascade settings to minimize orphaned records

## Migration Notes

When moving these schemas to the `supabase/` folder for actual deployment:

1. **Order matters**: Files are processed alphabetically, hence the numbering
2. **Dependencies**: Foreign key relationships require parent tables to exist first
3. **RLS policies**: Compatible with Supabase
4. **Functions**: All functions are in SQL - no external dependencies
5. **Triggers**: Automatic timestamp and calculation triggers included

## Testing Recommendations

Before production deployment:
1. Test all RLS policies with different user roles
2. Verify trigger behavior (cost calculations, auto-comments)  
3. Performance test with realistic data volumes
4. Validate all constraints and business rules
5. Test migration rollback scenarios

## Future Considerations

Areas for potential expansion:
- **Inventory management**: Stock levels, reorder points
- **Notifications system**: Email/SMS alerts for status changes
- **Reporting tables**: Materialized views for analytics
- **File attachments**: Integration with Supabase Storage
- **Customer portal**: Public-facing views and APIs
- **Audit logging**: Separate audit table for all data changes