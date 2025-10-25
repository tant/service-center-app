#!/bin/bash

# Service Center Database Schema Setup Script
# This script helps copy schema files and seed data to Supabase folder and generate migrations
#
# Updated: 2025-10-25
# Changes:
# - Added support for files 09-12 (RBAC and audit logging)
# - Added seed.sql copy from docs/data/schemas/ (source of truth)
# - Automatic seed data loading (REQUIRED for workflow system)
# - Improved error handling for seed files
# - Added validation for generated migrations
# - Enhanced cleanup process

set -e

echo "🚀 Service Center Schema Setup (v2.0)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Silent checks
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    echo -e "${RED}❌ Error: Run from project root (need package.json and supabase/ folder)${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null && ! command -v pnpx &> /dev/null; then
    echo -e "${RED}❌ Error: pnpm/pnpx not available${NC}"
    exit 1
fi

# Setup directories and check files
mkdir -p supabase/schemas

if [ ! -d "docs/data/schemas" ]; then
    echo -e "${RED}❌ Error: docs/data/schemas directory not found${NC}"
    exit 1
fi

# Copy schema files in proper order
echo -e "${BLUE}📁 Copying schema files in proper order...${NC}"

# Order of execution matters due to dependencies
# 00_base_schema.sql must be first (defines ENUMs, DOMAINs, and base functions)
# Core tables follow, then Phase 2 extensions, then RBAC helpers, then policies and views
SCHEMA_FILES=(
    "00_base_schema.sql"
    "01_users_and_customers.sql"
    "02_products_and_inventory.sql"
    "03_service_tickets.sql"
    "04_task_and_warehouse.sql"
    "05_service_requests.sql"
    "06_policies_and_views.sql"
    "07_storage.sql"
    "08_inventory_functions.sql"
    "09_role_helpers.sql"
    "10_audit_logs.sql"
    "11_rls_policy_updates.sql"
    "12_seed_test_users.sql"
)

# Copy each file in order
for file in "${SCHEMA_FILES[@]}"; do
    if [ -f "docs/data/schemas/$file" ]; then
        cp "docs/data/schemas/$file" "supabase/schemas/"
        echo -e "  ✓ Copied $file"
    else
        echo -e "${YELLOW}  ⚠️  Warning: $file not found, skipping${NC}"
    fi
done

echo -e "${GREEN}✅ Schema files copied${NC}"

# Copy seed data file
echo -e "${BLUE}📦 Copying seed data file...${NC}"
if [ -f "docs/data/schemas/seed.sql" ]; then
    cp "docs/data/schemas/seed.sql" "supabase/"
    echo -e "  ✓ Copied seed.sql"
else
    echo -e "${YELLOW}  ⚠️  Warning: seed.sql not found in docs/data/schemas/${NC}"
fi

# Get database connection URL
echo -e "${BLUE}🔌 Getting database connection...${NC}"
DB_URL=$(pnpx supabase status 2>/dev/null | grep "Database URL" | awk '{print $3}')
if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Error: Could not get database URL. Is Supabase running?${NC}"
    echo -e "${YELLOW}   Run: pnpx supabase start${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Connected to: $DB_URL${NC}"

# Create storage buckets from seed data
echo -e "${BLUE}🪣 Creating storage buckets...${NC}"
if [ -f "docs/data/seeds/storage_buckets.sql" ]; then
    BUCKET_OUTPUT=$(psql "$DB_URL" -f docs/data/seeds/storage_buckets.sql 2>&1)
    BUCKET_EXIT_CODE=$?

    if [ $BUCKET_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ Storage buckets created${NC}"
    else
        if echo "$BUCKET_OUTPUT" | grep -q "already exists\|duplicate key"; then
            echo -e "${YELLOW}⚠️  Buckets already exist, continuing...${NC}"
        else
            echo -e "${YELLOW}⚠️  Bucket creation warning:${NC}"
            echo -e "${YELLOW}   $BUCKET_OUTPUT${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Storage buckets seed file not found, skipping...${NC}"
fi

# Generate migration (simple, may take some time)
echo -e "${BLUE}📊 Generating migration (this may take a little while)...${NC}"
if pnpx supabase db diff -f init_schema --schema public > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Migration generated (init_schema)${NC}"

    # Fix DROP POLICY statements for fresh database compatibility
    MIGRATION_FILE=$(ls -t supabase/migrations/*_init_schema.sql 2>/dev/null | head -1)
    if [ -f "$MIGRATION_FILE" ]; then
        # Add IF EXISTS to DROP POLICY statements
        if grep -q "^drop policy \"" "$MIGRATION_FILE" 2>/dev/null; then
            echo -e "${BLUE}   🔧 Adding IF EXISTS to DROP POLICY statements...${NC}"
            sed -i 's/^drop policy "/drop policy if exists "/' "$MIGRATION_FILE"
            echo -e "${GREEN}   ✓ Migration file updated for fresh database compatibility${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Migration generation failed or no changes detected${NC}"
    echo -e "${YELLOW}   Continuing to attempt migration application...${NC}"
fi

# Apply migration
echo -e "${BLUE}🔄 Applying migration...${NC}"
if pnpx supabase migration up; then
    echo -e "${GREEN}✅ Migration applied${NC}"
else
    echo -e "${RED}❌ Migration application failed${NC}"
    exit 1
fi

# Apply storage policies (db diff doesn't capture policies on system tables)
echo -e "${BLUE}🔐 Applying storage policies...${NC}"
if [ -f "docs/data/schemas/07_storage.sql" ]; then
    echo -e "${BLUE}   📄 File found: docs/data/schemas/07_storage.sql${NC}"
    echo -e "${BLUE}   🔧 Executing storage policies via psql...${NC}"

    # Capture both stdout and stderr for debugging
    POLICY_OUTPUT=$(psql "$DB_URL" -f docs/data/schemas/07_storage.sql 2>&1)
    POLICY_EXIT_CODE=$?

    if [ $POLICY_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ Storage policies applied successfully${NC}"
        if [ -n "$POLICY_OUTPUT" ]; then
            echo -e "${BLUE}   Output:${NC}"
            echo "$POLICY_OUTPUT" | sed 's/^/      /'
        fi
    else
        echo -e "${YELLOW}⚠️  Storage policy application encountered issues${NC}"
        echo -e "${YELLOW}   Exit code: $POLICY_EXIT_CODE${NC}"
        echo -e "${YELLOW}   Output:${NC}"
        echo "$POLICY_OUTPUT" | sed 's/^/      /'

        # Check if it's just a "already exists" error
        if echo "$POLICY_OUTPUT" | grep -q "already exists"; then
            echo -e "${YELLOW}   → Policies already exist, continuing...${NC}"
        else
            echo -e "${RED}   → Unexpected error during policy creation${NC}"
            echo -e "${RED}   → This will cause permission errors when uploading files!${NC}"
            exit 1
        fi
    fi

    # Verify policies were created
    echo -e "${BLUE}   🔍 Verifying storage policies...${NC}"
    POLICY_COUNT=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'" 2>&1)

    if [[ "$POLICY_COUNT" =~ ^[0-9]+$ ]]; then
        echo -e "${BLUE}   Found $POLICY_COUNT storage policies${NC}"

        if [ "$POLICY_COUNT" -eq 0 ]; then
            echo -e "${RED}   ⚠️  WARNING: No storage policies found in database!${NC}"
            echo -e "${RED}   This will cause permission errors when uploading files.${NC}"
            exit 1
        else
            echo -e "${GREEN}   ✓ Storage policies verified ($POLICY_COUNT policies active)${NC}"
        fi
    else
        echo -e "${YELLOW}   ⚠️  Could not verify policy count: $POLICY_COUNT${NC}"
    fi
else
    echo -e "${RED}❌ Error: Storage policies file not found at docs/data/schemas/07_storage.sql${NC}"
    exit 1
fi

# Cleanup: remove SQL files from migrations and schemas (no backup)
echo -e "${BLUE}🧹 Removing SQL files from supabase/migrations and supabase/schemas (no backup)...${NC}"
# Remove any .sql files directly
rm -f supabase/migrations/*.sql 2>/dev/null || true
rm -f supabase/schemas/*.sql 2>/dev/null || true

echo -e "${GREEN}✅ Cleanup completed. SQL files removed from supabase/migrations and supabase/schemas${NC}"

# Final verification
echo -e "${BLUE}🔍 Verifying database setup...${NC}"
TABLE_COUNT=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -ge 25 ]; then
    echo -e "${GREEN}   ✓ Database verified: $TABLE_COUNT tables created${NC}"
else
    echo -e "${YELLOW}   ⚠️  Warning: Only $TABLE_COUNT tables found (expected 25+)${NC}"
fi

# Check for RBAC functions
RBAC_FUNCS=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_my_role', 'has_role', 'has_any_role')" 2>/dev/null || echo "0")
if [ "$RBAC_FUNCS" -ge 3 ]; then
    echo -e "${GREEN}   ✓ RBAC functions verified: $RBAC_FUNCS functions created${NC}"
else
    echo -e "${YELLOW}   ⚠️  Warning: Only $RBAC_FUNCS RBAC functions found (expected 3+)${NC}"
fi

echo
echo -e "${GREEN}🎉 Schema setup completed successfully!${NC}"
echo

# Load seed data (REQUIRED for workflow system)
echo -e "${BLUE}🌱 Loading seed data...${NC}"
echo -e "   Seed data creates 27+ task types required for the workflow system."
if psql "$DB_URL" -f supabase/seed.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Seed data loaded successfully${NC}"

    # Count inserted task types
    TASK_TYPE_COUNT=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM public.task_types" 2>/dev/null || echo "0")
    if [ "$TASK_TYPE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}   ✓ $TASK_TYPE_COUNT task types created${NC}"
    fi
else
    echo -e "${RED}❌ Failed to load seed data${NC}"
    echo -e "${RED}   This is REQUIRED for the workflow system to function!${NC}"
    exit 1
fi

echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Create admin user via /setup endpoint"
echo -e "  2. Create test users (see docs/data/schemas/12_seed_test_users.sql)"
echo -e "  3. Start development: pnpm dev"
echo
echo -e "📚 For more information, see docs/DATABASE_SETUP.md"
echo
exit 0