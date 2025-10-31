#!/bin/bash

# Service Center Database Schema Setup Script
# This script copies schema files to Supabase folder and generates migrations
#
# Updated: 2025-10-31
# Version: 4.0 (Schema Refactoring - 100-900 Numbering Scheme)
#
# Changes:
# - Refactored schema files into 100-900 numbering scheme
# - 20 files organized by functional category (ENUMs → Functions → Tables → Constraints → Triggers → Views → RLS → Seed)
# - Simplified copy process using pattern matching
# - Default warehouse seed data included in schema (900_default_warehouse_seed.sql)

set -e

echo "🚀 Service Center Schema Setup (v4.0 - Refactored)"

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

# Copy schema files (100-900 numbering scheme)
echo -e "${BLUE}📁 Copying schema files...${NC}"

# Copy all numbered schema files (100-900)
# Files are automatically processed in numerical order by Supabase
# 100: ENUMs/Sequences → 150: Functions → 200-205: Tables → 300-301: Constraints
# → 500-502: Functions → 600-601: Triggers → 700: Views → 800-802: RLS → 900: Seed
if cp docs/data/schemas/[1-9]*.sql supabase/schemas/ 2>/dev/null; then
    FILE_COUNT=$(ls -1 supabase/schemas/[1-9]*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Copied $FILE_COUNT schema files${NC}"
else
    echo -e "${RED}❌ Error: Failed to copy schema files${NC}"
    exit 1
fi

# Note: Seed data (default warehouse system) is now included in 900_default_warehouse_seed.sql
# No separate seed.sql file needed

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
if [ -f "docs/data/schemas/802_storage_policies.sql" ]; then
    echo -e "${BLUE}   📄 File found: docs/data/schemas/802_storage_policies.sql${NC}"
    echo -e "${BLUE}   🔧 Executing storage policies via psql...${NC}"

    # Capture both stdout and stderr for debugging
    POLICY_OUTPUT=$(psql "$DB_URL" -f docs/data/schemas/802_storage_policies.sql 2>&1)
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
    echo -e "${RED}❌ Error: Storage policies file not found at docs/data/schemas/802_storage_policies.sql${NC}"
    exit 1
fi

# Cleanup: remove SQL files from schemas (keep migrations!)
echo -e "${BLUE}🧹 Cleaning up supabase/schemas...${NC}"
# Remove schema files from supabase/schemas (they're just temp copies)
rm -f supabase/schemas/*.sql 2>/dev/null || true

echo -e "${GREEN}✅ Cleanup completed. Schema files removed from supabase/schemas${NC}"
echo -e "${YELLOW}   Note: Migrations in supabase/migrations/ are preserved${NC}"

# Final verification
echo -e "${BLUE}🔍 Verifying database setup...${NC}"
TABLE_COUNT=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -ge 30 ]; then
    echo -e "${GREEN}   ✓ Database verified: $TABLE_COUNT tables created${NC}"
else
    echo -e "${YELLOW}   ⚠️  Warning: Only $TABLE_COUNT tables found (expected 30+)${NC}"
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

# Note: Default warehouse seed data is included in 900_default_warehouse_seed.sql
echo -e "${BLUE}📦 Verifying default warehouse system...${NC}"
WAREHOUSE_COUNT=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM public.physical_warehouses WHERE is_system_default = true" 2>/dev/null || echo "0")
VIRTUAL_COUNT=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM public.virtual_warehouses" 2>/dev/null || echo "0")
if [ "$WAREHOUSE_COUNT" -eq 1 ] && [ "$VIRTUAL_COUNT" -eq 7 ]; then
    echo -e "${GREEN}   ✓ Default warehouse system verified (1 physical, 7 virtual)${NC}"
else
    echo -e "${YELLOW}   ⚠️  Warning: Warehouse counts unexpected (physical: $WAREHOUSE_COUNT, virtual: $VIRTUAL_COUNT)${NC}"
fi

echo
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Create admin user via /setup endpoint"
echo -e "  2. Start development: pnpm dev"
echo
echo -e "📚 For more information, see docs/data/schemas/README.md"
echo
exit 0